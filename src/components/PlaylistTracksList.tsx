import { fontSize } from '@/constants/tokens'
import { generateTracksListId } from '@/helpers/miscellaneous'
import { Playlist } from '@/helpers/types'
import { defaultStyles } from '@/styles'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { Track } from 'react-native-track-player'
import { QueueControls } from './QueueControls'
import { TracksList } from './TracksList'

type PlaylistTracksListProps = {
	playlist: Playlist
	tracks: Track[]
	allowDelete?: boolean
	onDeleteTrack?: (trackId: string) => void
	showImportMenu?: boolean
	onImportTrack?: () => void
	isMultiSelectMode?: boolean
	selectedTracks?: Set<string>
	toggleMultiSelectMode?: () => void
	onToggleSelection?: (trackId: string) => void
	onSelectAll?: () => void
	deleteSelectedTracks?: () => void
	exportSelectedTracks?: () => void
	headerRight?: React.ReactNode
	showDownloadButton?: boolean
}

export const PlaylistTracksList = ({
	playlist,
	tracks,
	allowDelete = false,
	onDeleteTrack,
	showImportMenu = false,
	onImportTrack,
	isMultiSelectMode = false,
	selectedTracks = new Set(),
	onToggleSelection,
	toggleMultiSelectMode,
	onSelectAll,
	deleteSelectedTracks,
	exportSelectedTracks,
	headerRight,
	showDownloadButton = true,
}: PlaylistTracksListProps) => {
	// const filteredPlaylistTracks = useMemo(() => {
	// 	return playlist.tracks.filter(trackTitleFilter(search))
	// }, [playlist.tracks, search])

	return (
		<TracksList
			id={generateTracksListId(playlist.title)}
			scrollEnabled={false}
			hideQueueControls={true}
			ListHeaderComponentStyle={styles.playlistHeaderContainer}
			ListHeaderComponent={
				<View>
					<View style={styles.artworkImageContainer}>
						<FastImage
							source={{
								uri: playlist.coverImg || playlist.artwork,
								priority: FastImage.priority.high,
							}}
							style={styles.artworkImage}
						/>
					</View>

					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 22, paddingHorizontal: 20 }}>
						<Text numberOfLines={1} style={[styles.playlistNameText, { marginTop: 0, flex: 1 }]}>
							{playlist.title}
						</Text>
						{headerRight && <View style={{ marginLeft: 10 }}>{headerRight}</View>}
					</View>

					<QueueControls
						style={{ paddingTop: 24 }}
						tracks={tracks}
						showImportMenu={showImportMenu}
						onImportTrack={onImportTrack}
						isMultiSelectMode={isMultiSelectMode}
						onSelectAll={onSelectAll}
						isAllSelected={selectedTracks.size === tracks.length}
						deleteSelectedTracks={deleteSelectedTracks}
						exportSelectedTracks={exportSelectedTracks}
						showDownloadButton={showDownloadButton}
					/>
				</View>
			}
			tracks={tracks}
			allowDelete={allowDelete}
			onDeleteTrack={onDeleteTrack}
			isMultiSelectMode={isMultiSelectMode}
			selectedTracks={selectedTracks}
			onToggleSelection={onToggleSelection}
			toggleMultiSelectMode={toggleMultiSelectMode}
		/>
	)
}

const styles = StyleSheet.create({
	playlistHeaderContainer: {
		flex: 1,
		marginBottom: 32,
	},
	artworkImageContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		height: 300,
	},
	artworkImage: {
		width: '85%',
		height: '100%',
		resizeMode: 'cover',
		borderRadius: 12,
	},
	playlistNameText: {
		...defaultStyles.text,
		marginTop: 22,
		textAlign: 'center',
		fontSize: fontSize.lg,
		fontWeight: '800',
	},
})
