import { PlaylistsList } from '@/components/PlaylistsList'
import musicSdk from '@/components/utils/musicSdk'
import { colors, fontSize, screenPadding } from '@/constants/tokens'
import { useNavigationSearch } from '@/hooks/useNavigationSearch'
import { defaultStyles } from '@/styles'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const PlaylistsScreen = () => {
	const router = useRouter()
	const search = useNavigationSearch({
		searchBarOptions: {
			placeholder: '在歌单中搜索',
			cancelButtonText: '取消',
		},
		searchOnSubmit: true,
	})
	const [playlists, setPlaylists] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [tags, setTags] = useState([])
	const [selectedTagId, setSelectedTagId] = useState('')
	const [sortId, setSortId] = useState(5) // 5: 最热, 2: 最新
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)

	// 获取分类标签
	useEffect(() => {
		const fetchTags = async () => {
			try {
				const { tags } = await musicSdk['tx'].songList.getTags()
				// 扁平化标签结构，方便展示
				const allTags = tags.flatMap(group => group.list)
				setTags(allTags)
			} catch (error) {
				console.error('Failed to fetch tags:', error)
			}
		}
		fetchTags()
	}, [])

	// 获取歌单列表
	const fetchPlaylists = useCallback(async (refresh = false) => {
		if (isLoading || (!hasMore && !refresh)) return

		setIsLoading(true)
		try {
			const currentPage = refresh ? 1 : page
			let data
			
			if (search) {
				// 搜索模式
				data = await musicSdk['tx'].songList.search(search, currentPage)
			} else {
				// 推荐模式
				data = await musicSdk['tx'].songList.getList(sortId, selectedTagId, currentPage)
			}
			
			const newPlaylists = data.list.map(item => ({
				id: item.id,
				title: item.name,
				coverImg: item.img,
				description: item.desc,
				author: item.author,
				playCount: item.play_count
			}))

			setPlaylists(prev => refresh ? newPlaylists : [...prev, ...newPlaylists])
			setPage(currentPage + 1)
			setHasMore(newPlaylists.length >= data.limit)
		} catch (error) {
			console.error('Failed to fetch playlists:', error)
		} finally {
			setIsLoading(false)
		}
	}, [isLoading, hasMore, page, sortId, selectedTagId, search])

	// 初始加载和筛选条件变化时刷新
	useEffect(() => {
		setPage(1)
		setHasMore(true)
		fetchPlaylists(true)
	}, [sortId, selectedTagId, search])

	const handleTagPress = (tagId) => {
		if (selectedTagId === tagId) {
			setSelectedTagId('') // 取消选择
		} else {
			setSelectedTagId(tagId)
		}
	}

	const handleSortPress = (id) => {
		setSortId(id)
	}

	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
				stickyHeaderIndices={!search ? [0] : []} // 搜索模式下不需要吸顶筛选栏
				onScroll={({ nativeEvent }) => {
					const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
					const paddingToBottom = 20
					const isCloseToBottom =
						layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom

					if (isCloseToBottom) {
						fetchPlaylists()
					}
				}}
				scrollEventThrottle={400}
			>
				{!search && (
					<View style={styles.filterContainer}>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollContent}>
							<TouchableOpacity 
								style={[styles.tag, sortId === 5 && styles.activeTag]} 
								onPress={() => handleSortPress(5)}
							>
								<Text style={[styles.tagText, sortId === 5 && styles.activeTagText]}>最热</Text>
							</TouchableOpacity>
							<TouchableOpacity 
								style={[styles.tag, sortId === 2 && styles.activeTag]} 
								onPress={() => handleSortPress(2)}
							>
								<Text style={[styles.tagText, sortId === 2 && styles.activeTagText]}>最新</Text>
							</TouchableOpacity>
							<View style={styles.divider} />
							{tags.map(tag => (
								<TouchableOpacity
									key={tag.id}
									style={[styles.tag, selectedTagId === tag.id && styles.activeTag]}
									onPress={() => handleTagPress(tag.id)}
								>
									<Text style={[styles.tagText, selectedTagId === tag.id && styles.activeTagText]}>
										{tag.name}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				)}

				<PlaylistsList
					scrollEnabled={false}
					playlists={playlists}
					onPlaylistPress={(playlist) => {
						router.push(`/(tabs)/playlists/${playlist.id}`)
					}}
				/>
				{isLoading && (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={colors.primary} />
					</View>
				)}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	filterContainer: {
		paddingVertical: 10,
		// borderBottomWidth: 1,
		// borderBottomColor: '#333',
		height: 50, // 显式设置高度
		backgroundColor: colors.background, // 吸顶时需要背景色遮挡内容
	},
	tagsScrollContent: {
		paddingHorizontal: screenPadding.horizontal,
		alignItems: 'center', // 垂直居中
	},
	tag: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 15,
		backgroundColor: '#333',
		marginRight: 8,
	},
	activeTag: {
		backgroundColor: colors.primary,
	},
	tagText: {
		color: '#fff',
		fontSize: fontSize.xs,
	},
	activeTagText: {
		color: '#000',
		fontWeight: 'bold',
	},
	divider: {
		width: 1,
		height: '60%',
		backgroundColor: '#666',
		marginHorizontal: 8,
		alignSelf: 'center',
	},
	loadingContainer: {
		paddingVertical: 20,
		alignItems: 'center',
	}
})

export default PlaylistsScreen
