-- ==============================================================================
-- 1. CLEANUP (Drop existing tables to start fresh)
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_participants;
DROP TABLE IF EXISTS public.chat_rooms;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.post_likes;
DROP TABLE IF EXISTS public.guestbook_entries;
DROP TABLE IF EXISTS public.posts;
-- posts table dropped here
DROP TABLE IF EXISTS public.profiles;
-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================
-- 2.1 PROFILES (User Information)
CREATE TABLE public.profiles (
     id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
     username text UNIQUE,
     full_name text,
     avatar_url text,
     location text,
     mbti text,
     job text,
     status_message text,
     updated_at timestamp with time zone,
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2.2 POSTS (Feed Items: Gatherings, Questions, Life, Events)
CREATE TABLE public.posts (
     id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
     author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     type text NOT NULL CHECK (
          type IN (
               'gathering',
               'question',
               'life',
               'club',
               'event',
               'hiking',
               'town_story',
               'news',
               'paju_pick',
               'daily_photo',
               'sports',
               'pet',
               'wine'
          )
     ),
     title text,
     content text,
     image_urls text [] DEFAULT '{}',
     location_name text,
     -- Gathering specific
     max_participants integer,
     current_participants integer DEFAULT 1,
     meeting_time timestamp with time zone,
     -- Question specific
     is_solved boolean DEFAULT false,
     -- Event specific
     price integer DEFAULT 0,
     expires_at timestamp with time zone,
     -- For Time Attack / Events
     -- Common stats
     likes_count integer DEFAULT 0,
     comments_count integer DEFAULT 0,
     views integer DEFAULT 0,
     -- ✅ Added Missing Column
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2.3 GUESTBOOK ENTRIES (Minihompy)
CREATE TABLE public.guestbook_entries (
     id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
     host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     content text NOT NULL,
     is_secret boolean DEFAULT false,
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2.4 POST LIKES
CREATE TABLE public.post_likes (
     user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
     PRIMARY KEY (user_id, post_id)
);
-- 2.5 NOTIFICATIONS
CREATE TABLE public.notifications (
     id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     type text NOT NULL CHECK (
          type IN ('like', 'comment', 'chat', 'notice', 'level_up')
     ),
     message text NOT NULL,
     is_read boolean DEFAULT false,
     related_link text,
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2.6 CHAT ROOMS
CREATE TABLE public.chat_rooms (
     id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
     type text DEFAULT 'dm' CHECK (type IN ('dm', 'group')),
     name text,
     -- For group chats
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2.7 CHAT PARTICIPANTS
CREATE TABLE public.chat_participants (
     room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
     user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
     PRIMARY KEY (room_id, user_id)
);
-- 2.8 CHAT MESSAGES
CREATE TABLE public.chat_messages (
     id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
     room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
     sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     content text NOT NULL,
     is_read boolean DEFAULT false,
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- ==============================================================================
-- 3. SECURITY & POLICIES (RLS)
-- ==============================================================================
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
-- 3.1 PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id);
-- 3.2 POSTS POLICIES
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts" ON public.posts FOR
UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);
-- 3.3 GUESTBOOK POLICIES
CREATE POLICY "Guestbook viewable by everyone" ON public.guestbook_entries FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can sign guestbook" ON public.guestbook_entries FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- 3.4 LIKES POLICIES
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON public.post_likes FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);
-- 3.5 HANDLER FOR NEW USER SIGNUP (Auto-create Profile)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.profiles (id, username, full_name, avatar_url)
VALUES (
          new.id,
          new.raw_user_meta_data->>'username',
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url'
     );
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- ==============================================================================
-- 4. SEED DATA (Virtual Users & Posts)
-- ==============================================================================
DO $$
DECLARE v_owner_id uuid;
v_resident_id uuid;
BEGIN -- 1. 가상 유저 (사장님) 처리
-- 1-A. auth.users 확인 및 생성
SELECT id INTO v_owner_id
FROM auth.users
WHERE email = 'owner@pajuon.com';
IF v_owner_id IS NULL THEN
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
          uuid_generate_v4(),
          'owner@pajuon.com',
          '{"username": "야당역_이자카야", "full_name": "유쾌한 사장님", "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=owner", "location": "파주 야당동"}'::jsonb
     )
RETURNING id INTO v_owner_id;
END IF;
-- 1-B. public.profiles 강제 동기화 (프로필이 없으면 생성)
INSERT INTO public.profiles (id, username, full_name, avatar_url, location)
VALUES (
          v_owner_id,
          '야당역_이자카야',
          '유쾌한 사장님',
          'https://api.dicebear.com/7.x/notionists/svg?seed=owner',
          '파주 야당동'
     ) ON CONFLICT (id) DO NOTHING;
-- 2. 가상 유저 (동네 주민) 처리
-- 2-A. auth.users 확인 및 생성
SELECT id INTO v_resident_id
FROM auth.users
WHERE email = 'resident@pajuon.com';
IF v_resident_id IS NULL THEN
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
          uuid_generate_v4(),
          'resident@pajuon.com',
          '{"username": "파주사랑꾼", "full_name": "김파주", "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=resident", "location": "파주 운정"}'::jsonb
     )
RETURNING id INTO v_resident_id;
END IF;
-- 2-B. public.profiles 강제 동기화 (프로필이 없으면 생성)
INSERT INTO public.profiles (id, username, full_name, avatar_url, location)
VALUES (
          v_resident_id,
          '파주사랑꾼',
          '김파주',
          'https://api.dicebear.com/7.x/notionists/svg?seed=resident',
          '파주 운정'
     ) ON CONFLICT (id) DO NOTHING;
-- 3. [이벤트] 하이볼 1+1 (이미지 교체: 청량한 하이볼)
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          price,
          expires_at,
          image_urls,
          likes_count,
          views
     )
VALUES (
          v_owner_id,
          'event',
          '🍺 금요일 밤! 산토리 하이볼 무제한 1+1',
          '답답한 한 주, 시원하게 날려버리세요! 🍋\n야당역 3번 출구 앞 이자카야에서 불금을 책임집니다.\n\n✅ 1+1 혜택은 8시부터 10시까지!\n✅ 선착순 10팀 모듬 꼬치 서비스',
          '야당역 3번 출구 앞',
          0,
          now() + interval '2 hours',
          ARRAY ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
          24,
          120
     );
-- 4. [모임] 주말 러닝 크루
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          max_participants,
          current_participants,
          image_urls,
          likes_count,
          views
     )
VALUES (
          v_resident_id,
          'gathering',
          '🏃‍♂️ 운정호수공원 모닝 러닝 하실 분!',
          '혼자 뛰니까 자꾸 걷게 되네요.. ㅋㅋ\n이번주 토요일 아침 7시에 같이 가볍게 5km 뛰실 분 구합니다.\n초보 환영합니다! 끝나고 커피 한잔 해요 ☕️',
          '운정호수공원',
          4,
          2,
          ARRAY ['https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=800'],
          15,
          45
     );
-- 5. [질문] 세탁소 추천
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          views,
          likes_count
     )
VALUES (
          v_resident_id,
          'question',
          '세탁소 추천 좀 해주세요! 👔',
          '겨울 패딩 드라이 맡겨야 하는데 꼼꼼하게 잘하는 곳 있을까요?\n혹시 수거 배달 되는 곳이면 더 좋습니다!',
          '파주 교하',
          42,
          3
     );
-- 6. [일상] 고양이 자랑
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          image_urls,
          likes_count,
          views
     )
VALUES (
          v_resident_id,
          'life',
          '길냥이 간택당했습니다.. 🐱',
          '현관 앞에 얌전히 앉아있는데 어떡하죠..\n일단 츄르 하나 줬는데 안 가네요 ㅋㅋ\n이름을 뭘로 지어줄까요?',
          '금촌동',
          ARRAY ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800'],
          152,
          300
     );
-- 7. [멍냥회관] 강아지 산책 모임
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          max_participants,
          current_participants,
          image_urls,
          likes_count,
          views
     )
VALUES (
          v_resident_id,
          'club',
          -- 멍냥회관은 'club' 타입 사용 (MeetingFeed에서 필터링됨)
          '🦮 토요일 운정 호수공원 댕댕이 산책 모임',
          '겁 많은 강아지 친구들 환영합니다! \n서로 냄새 맡고 친해질 시간 충분히 가지면서 천천히 걸어요.\n간식도 나눠먹고 견주들끼리 수다도 떨어요!',
          '운정 호수공원 잔디광장',
          6,
          3,
          ARRAY ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800'],
          45,
          120
     );
-- 8. [멍냥회관] 캣타워 나눔해요
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          image_urls,
          likes_count,
          views
     )
VALUES (
          v_resident_id,
          'life',
          -- 멍냥회관에서 보여줄 일상/나눔 글
          '캣타워 무료 나눔합니다 (사용감 있음)',
          '저희 냥이가 뚱냥이가 되어서 더 큰 걸로 바꿨어요.\n스크래쳐 부분은 좀 낡았는데 기둥은 튼튼합니다.\n가져가실 분 채팅 주세요!',
          '한빛마을 5단지',
          ARRAY ['https://images.unsplash.com/photo-1541781777621-3f130e108f18?auto=format&fit=crop&q=80&w=800'],
          12,
          85
     );
-- 9. [hiking] 감악산 출렁다리 등반
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          max_participants,
          current_participants,
          image_urls,
          likes_count,
          views
     )
VALUES (
          v_resident_id,
          'hiking',
          '🏔️ 감악산 출렁다리 주말 산행 (초보 가능)',
          '날씨가 너무 좋아서 감악산 가려고 합니다.\n출렁다리에서 인생샷 찍고 내려와서 도토리묵에 막걸리 한잔 어때요? 😋\n왕복 3시간 코스로 천천히 다녀올 예정입니다.',
          '감악산 주차장 (적성면)',
          8,
          5,
          ARRAY ['https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800'],
          32,
          150
     );
-- 10. [town_story] 야식 맛집 추천
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          likes_count,
          views
     )
VALUES (
          v_resident_id,
          'town_story',
          '🌙 야심한 밤.. 야식 메뉴 추천 좀 부탁드려요',
          '오늘따라 잠도 안 오고 배는 고프고..\n다이어트는 내일부터 하기로 했습니다 ^_^\n금촌/운정 배달 맛집 추천 부탁드립니다! 족발 vs 치킨??',
          '금촌 로타리 부근',
          8,
          45
     );
END $$;