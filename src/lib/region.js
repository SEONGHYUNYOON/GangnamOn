const REGION_ALIASES = {
     '역삼1동': '역삼동',
     '역삼2동': '역삼동',
     '논현1동': '논현동',
     '논현2동': '논현동',
};

export const normalizeGangnamRegion = (region = '') => REGION_ALIASES[region] || region;

export const GANGNAM_REGIONS = [
     '역삼동',
     '삼성동',
     '논현동',
     '신사동',
     '청담동',
     '압구정동',
     '서초동',
     '방배동',
     '사평동',
     '잠원동',
     '개포동',
     '세곡동',
];
