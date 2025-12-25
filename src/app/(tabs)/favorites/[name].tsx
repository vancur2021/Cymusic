import { PlaylistTracksList } from '@/components/PlaylistTracksList'
import musicSdk from '@/components/utils/musicSdk'
import { colors, screenPadding } from '@/constants/tokens'
import myTrackPlayer, { playListsStore } from '@/helpers/trackPlayerIndex'
import { Playlist } from '@/helpers/types'
import { defaultStyles } from '@/styles'
import { FontAwesome } from '@expo/vector-icons'
import { Redirect, Stack, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native'
import { Track } from 'react-native-track-player'

const PlaylistScreen = () => {
	const { name: playlistID, isOnline } = useLocalSearchParams<{ name: string; isOnline?: string }>()
	const playlists = playListsStore.useValue() as Playlist[] | null

	// 在线歌单状态
	const [playlistInfo, setPlaylistInfo] = useState<any>(null)
	const [onlineTracks, setOnlineTracks] = useState<Track[]>([])
	const [loading, setLoading] = useState(isOnline === 'true')

	const playlist = useMemo(() => {
		return playlists?.find((p) => p.id === playlistID)
	}, [playlistID, playlists])

	const isFavorited = useMemo(() => {
		return playlists?.some((pl) => pl.onlineId === playlistID && (pl.source as any) === 'tx')
	}, [playlistID, playlists])

	const toggleFavorite = () => {
		if (!playlistInfo) return

		if (isFavorited) {
			const targetPlaylist = playlists?.find(
				(pl) => pl.onlineId === playlistID && (pl.source as any) === 'tx',
			)
			if (targetPlaylist) {
				myTrackPlayer.deletePlayLists(targetPlaylist.id)
			}
		} else {
			myTrackPlayer.addPlayLists({
				id: `online_tx_${playlistID}`,
				platform: 'tx',
				artist: playlistInfo.author,
				title: playlistInfo.title,
				name: playlistInfo.title,
				artwork: playlistInfo.coverImg,
				description: playlistInfo.description,
				coverImg: playlistInfo.coverImg,
				onlineId: playlistID,
				source: 'tx' as any,
				songs: [],
			})
		}
	}

	useEffect(() => {
		const fetchPlaylistDetail = async () => {
			if (isOnline !== 'true' || !playlistID) return

			try {
				const data = await musicSdk['tx'].songList.getListDetail(playlistID)

				setPlaylistInfo({
					id: playlistID,
					title: data.info.name,
					coverImg: data.info.img,
					description: data.info.desc,
					author: data.info.author,
				})

				const mappedTracks = data.list.map((track: any) => ({
					id: track.songmid,
					url: 'Unknown',
					title: track.name,
					artist: track.singer,
					album: track.albumName,
					artwork: track.img,
					duration: 0,
					singerImg: track.singerImg,
				}))

				setOnlineTracks(mappedTracks)
			} catch (error) {
				console.error('Failed to fetch playlist detail:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchPlaylistDetail()
	}, [playlistID, isOnline])

	const songs = useMemo(() => {
		return isOnline === 'true' ? onlineTracks : playlist?.songs || []
	}, [isOnline, onlineTracks, playlist])

	const handleDeleteTrack = useCallback(
		(trackId: string) => {
			if (isOnline !== 'true') {
				myTrackPlayer.deleteSongFromStoredPlayList(playlist as any, trackId)
			}
		},
		[playlist, isOnline],
	)

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

	if (isOnline !== 'true' && !playlist) {
		console.warn(`Playlist ${playlistID} was not found!`)
		return <Redirect href={'/(tabs)/favorites'} />
	}

	return (
		<View style={defaultStyles.container}>
			<Stack.Screen
				options={{
					headerTitle: '',
					headerShadowVisible: false,
					headerTintColor: colors.primary,
				}}
			/>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
			>
				<PlaylistTracksList
					playlist={(isOnline === 'true' ? playlistInfo : playlist) as Playlist}
					tracks={songs as Track[]}
					allowDelete={isOnline !== 'true'}
					onDeleteTrack={handleDeleteTrack}
					headerRight={
						isOnline === 'true' ? (
							<TouchableOpacity onPress={toggleFavorite}>
								<FontAwesome
									name={isFavorited ? 'heart' : 'heart-o'}
									size={24}
									color={isFavorited ? colors.primary : colors.text}
								/>
							</TouchableOpacity>
						) : undefined
					}
				/>
			</ScrollView>
		</View>
	)
}

export default PlaylistScreen
