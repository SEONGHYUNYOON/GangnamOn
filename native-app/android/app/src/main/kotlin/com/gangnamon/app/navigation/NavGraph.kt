package com.gangnamon.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.gangnamon.app.ui.screens.HomeScreen
import com.gangnamon.app.ui.screens.MiniHomeScreen
import com.gangnamon.app.ui.screens.MyScreen
import com.gangnamon.app.ui.screens.NeighborhoodScreen
import com.gangnamon.app.ui.screens.UsedMarketScreen

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Neighborhood : Screen("neighborhood")
    data object UsedMarket : Screen("used_market")
    data object MiniHome : Screen("mini_home")
    data object My : Screen("my")
}

@Composable
fun GangnamOnNavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route
    ) {
        composable(Screen.Home.route) { HomeScreen() }
        composable(Screen.Neighborhood.route) { NeighborhoodScreen() }
        composable(Screen.UsedMarket.route) { UsedMarketScreen() }
        composable(Screen.MiniHome.route) { MiniHomeScreen() }
        composable(Screen.My.route) { MyScreen() }
    }
}
