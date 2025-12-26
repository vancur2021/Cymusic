import { playbackService } from '@/constants/playbackService'
import { colors } from '@/constants/tokens'
import LyricManager from '@/helpers/lyricManager'
import { useLogTrackPlayerState } from '@/hooks/useLogTrackPlayerState'
import { useSetupTrackPlayer } from '@/hooks/useSetupTrackPlayer'
import i18n, { setI18nConfig } from '@/utils/i18n'
import { router, SplashScreen, Stack } from 'expo-router'
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message'
import TrackPlayer from 'react-native-track-player'
SplashScreen.preventAutoHideAsync()

TrackPlayer.registerPlaybackService(() => playbackService)
setI18nConfig()
const App = () => {
	const handleTrackPlayerLoaded = useCallback(() => {
		setTimeout(SplashScreen.hideAsync, 1500)
	}, [])

	useSetupTrackPlayer({
		onLoad: handleTrackPlayerLoaded, //播放器初始化后调用这个回调函数。这里先传过去。
	})

	useLogTrackPlayerState()
	// myTrackPlayer.setupTrackPlayer()

	LyricManager.setup()
	const [isI18nReady, setIsI18nReady] = useState(false)
	const { hasShareIntent } = useShareIntentContext()

	useEffect(() => {
		if (hasShareIntent) {
			// we want to handle share intent event in a specific page
			console.log('[expo-router-index111] redirect to ShareIntent screen')
			console.log('[expo-router-index111] hasShareIntent', hasShareIntent)
			// router.push('/(modals)/settingModal')
		}
	}, [hasShareIntent])
	useEffect(() => {
		const initI18n = async () => {
			try {
				// 确保 i18n 配置已加载
				await setI18nConfig()
				setIsI18nReady(true)
			} catch (error) {
				console.error('Failed to initialize i18n:', error)
			}
		}

		initI18n()
	}, [])
	const toastConfig = {
		success: (props) => (
			<BaseToast
				{...props}
				style={{
					backgroundColor: 'rgba(30, 30, 30, 0.95)',
					borderLeftWidth: 0,
					borderRadius: 25,
					height: 50,
					width: '85%',
					marginTop: 10,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 4,
					elevation: 5,
				}}
				contentContainerStyle={{ paddingHorizontal: 20 }}
				text1Style={{
					fontSize: 15,
					fontWeight: '600',
					color: '#22c55e',
				}}
				text2Style={{
					fontSize: 13,
					fontWeight: '400',
					color: '#e5e5e5',
				}}
			/>
		),
		error: (props) => (
			<ErrorToast
				{...props}
				style={{
					backgroundColor: 'rgba(30, 30, 30, 0.95)',
					borderLeftWidth: 0,
					borderRadius: 25,
					height: 50,
					width: '85%',
					marginTop: 10,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 4,
					elevation: 5,
				}}
				contentContainerStyle={{ paddingHorizontal: 20 }}
				text1Style={{
					fontSize: 15,
					fontWeight: '600',
					color: colors.primary,
				}}
				text2Style={{
					fontSize: 13,
					fontWeight: '400',
					color: '#e5e5e5',
				}}
			/>
		),
		info: (props) => (
			<BaseToast
				{...props}
				style={{
					backgroundColor: 'rgba(30, 30, 30, 0.95)',
					borderLeftWidth: 0,
					borderRadius: 25,
					height: 50,
					width: '85%',
					marginTop: 10,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 4,
					elevation: 5,
				}}
				contentContainerStyle={{ paddingHorizontal: 20 }}
				text1Style={{
					fontSize: 15,
					fontWeight: '600',
					color: '#3b82f6',
				}}
				text2Style={{
					fontSize: 13,
					fontWeight: '400',
					color: '#e5e5e5',
				}}
			/>
		),
	}
	return (
		<ShareIntentProvider
			options={{
				debug: true,
				resetOnBackground: true,
				onResetShareIntent: () =>
					// used when app going in background and when the reset button is pressed
					router.replace({
						pathname: '/',
					}),
			}}
		>
			<SafeAreaProvider>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<RootNavigation />
					<StatusBar style="auto" />
					<Toast config={toastConfig} />
				</GestureHandlerRootView>
			</SafeAreaProvider>
		</ShareIntentProvider>
	)
}

const RootNavigation = () => {
	return (
		//每个 Stack.Screen 组件定义了一个可导航的屏幕
		<Stack>
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			<Stack.Screen
				name="player"
				options={{
					presentation: 'card',
					gestureEnabled: true,
					gestureDirection: 'vertical',
					animationDuration: 400,
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="(modals)/playList"
				options={{
					presentation: 'modal',
					gestureEnabled: true,
					gestureDirection: 'vertical',
					animationDuration: 400,
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="(modals)/addToPlaylist"
				options={{
					presentation: 'modal',
					headerStyle: {
						backgroundColor: colors.background,
					},
					headerTitle: i18n.t('addToPlaylist.title'),
					headerTitleStyle: {
						color: colors.text,
					},
				}}
			/>
			<Stack.Screen
				name="(modals)/settingModal"
				options={{
					presentation: 'modal',
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: 'vertical',
				}}
			/>
			<Stack.Screen
				name="(modals)/importPlayList"
				options={{
					presentation: 'modal',
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: 'vertical',
				}}
			/>
			<Stack.Screen
				name="(modals)/[name]"
				options={{
					presentation: 'modal',
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: 'vertical',
				}}
			/>
			<Stack.Screen
				name="(modals)/logScreen"
				options={{
					presentation: 'modal',
					headerShown: true,
					gestureEnabled: true,
					gestureDirection: 'vertical',
					headerTitle: '应用日志',
					headerStyle: {
						backgroundColor: colors.background,
					},
					headerTitleStyle: {
						color: colors.text,
					},
				}}
			/>
		</Stack>
	)
}

export default App
