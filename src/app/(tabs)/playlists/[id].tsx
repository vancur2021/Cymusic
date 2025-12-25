import { PlaylistTracksList } from '@/components/PlaylistTracksList'
import musicSdk from '@/components/utils/musicSdk'
import { colors, screenPadding } from '@/constants/tokens'
import myTrackPlayer, { playListsStore } from '@/helpers/trackPlayerIndex'
import { defaultStyles } from '@/styles'
import { FontAwesome } from '@expo/vector-icons'
import { Stack, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native'
import { Track } from 'react-native-track-player'

const PlaylistDetailScreen = () => {
	const { id } = useLocalSearchParams<{ id: string }>()
	const [playlistInfo, setPlaylistInfo] = useState<any>(null)
	const [tracks, setTracks] = useState<Track[]>([])
	const [loading, setLoading] = useState(true)
	const storedPlayLists = playListsStore.useValue() || []
	const isFavorited = storedPlayLists.some(
		(pl) => pl.onlineId === id && (pl.source as any) === 'tx'
	)

	const toggleFavorite = () => {
		if (!playlistInfo) return

		if (isFavorited) {
			// 找到对应的本地歌单ID进行删除
			const targetPlaylist = storedPlayLists.find(
				(pl) => pl.onlineId === id && (pl.source as any) === 'tx'
			)
			if (targetPlaylist) {
				myTrackPlayer.deletePlayLists(targetPlaylist.id)
			}
		} else {
			// 添加收藏
			myTrackPlayer.addPlayLists({
				id: `online_tx_${id}`, // 生成一个唯一的本地ID
				platform: 'tx',
				artist: playlistInfo.author,
				title: playlistInfo.title,
				name: playlistInfo.title,
				artwork: playlistInfo.coverImg,
				description: playlistInfo.description,
				coverImg: playlistInfo.coverImg,
				onlineId: id,
				source: 'tx' as any, // 标记来源
				songs: [], // 初始为空，或者可以考虑把当前加载的歌曲存进去
			})
		}
	}

	useEffect(() => {
		const fetchPlaylistDetail = async () => {
			if (!id) return

			try {
				const data = await musicSdk['tx'].songList.getListDetail(id)
				
				setPlaylistInfo({
					id: id,
					title: data.info.name,
					coverImg: data.info.img,
					description: data.info.desc,
					author: data.info.author,
				})

				const mappedTracks = data.list.map((track: any) => ({
					id: track.songmid,
					url: 'Unknown', // URL will be fetched when playing
					title: track.name,
					artist: track.singer,
					album: track.albumName,
					artwork: track.img,
					duration: 0, // Duration might need parsing or fetching
					singerImg: track.singerImg,
				}))

				setTracks(mappedTracks)
			} catch (error) {
				console.error('Failed to fetch playlist detail:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchPlaylistDetail()
	}, [id])

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: colors.background,
				}}
			>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		)
	}

	if (!playlistInfo) {
		return null
	}

	return (
		<View style={defaultStyles.container}>
			<Stack.Screen
				options={{
					headerTitle: '',
					headerTintColor: colors.primary,
				}}
			/>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
			>
				<PlaylistTracksList 
					playlist={playlistInfo} 
					tracks={tracks} 
					headerRight={
						<TouchableOpacity onPress={toggleFavorite}>
							<FontAwesome
								name={isFavorited ? 'heart' : 'heart-o'}
								size={24}
								color={isFavorited ? colors.primary : colors.text}
							/>
						</TouchableOpacity>
					}
				/>
			</ScrollView>
		</View>
	)
}

export default PlaylistDetailScreen
