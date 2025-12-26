import { logError } from '@/helpers/logger'
import * as FileSystem from 'expo-file-system'
import RNFS from 'react-native-fs'
import { Track } from 'react-native-track-player'
import { create } from 'zustand'

interface DownloadTask {
	track: Track
	progress: number
	status: 'waiting' | 'downloading' | 'paused' | 'completed' | 'failed'
	jobId?: number
	source?: 'user' | 'auto' // 区分来源：用户手动下载 或 自动缓存
}

interface DownloadState {
	tasks: Record<string, DownloadTask>
	isPaused: boolean
	concurrency: number
	addToQueue: (tracks: Track[], source?: 'user' | 'auto') => void
	pauseDownloads: () => void
	resumeDownloads: () => void
	removeTask: (trackId: string) => void
	clearQueueByTracks: (trackIds: string[]) => void
}

const cacheDir = FileSystem.documentDirectory + 'musicCache/'

export const useDownloadStore = create<DownloadState>((set, get) => ({
	tasks: {},
	isPaused: false,
	concurrency: 1,

	addToQueue: (tracks, source = 'user') => {
		const { tasks } = get()
		const newTasks = { ...tasks }
		let added = false

		tracks.forEach((track) => {
			if (!newTasks[track.id]) {
				newTasks[track.id] = {
					track,
					progress: 0,
					status: 'waiting',
					source,
				}
				added = true
			}
		})

		if (added) {
			set({ tasks: newTasks })
			get().resumeDownloads() // 尝试开始下载
		}
	},

	pauseDownloads: () => {
		const { tasks } = get()
		const updatedTasks = { ...tasks }
		
		// 停止所有正在下载的任务
		Object.keys(updatedTasks).forEach((id) => {
			if (updatedTasks[id].status === 'downloading' && updatedTasks[id].jobId) {
				RNFS.stopDownload(updatedTasks[id].jobId!)
				updatedTasks[id].status = 'paused'
			} else if (updatedTasks[id].status === 'waiting') {
				updatedTasks[id].status = 'paused'
			}
		})

		set({ isPaused: true, tasks: updatedTasks })
	},

	resumeDownloads: () => {
		set({ isPaused: false })
		const { tasks, concurrency } = get()
		
		// 将所有已暂停的任务恢复为等待状态
		const updatedTasks = { ...tasks }
		Object.keys(updatedTasks).forEach(id => {
			if (updatedTasks[id].status === 'paused') {
				updatedTasks[id].status = 'waiting'
			}
		})
		set({ tasks: updatedTasks })

		// 检查当前正在下载的数量
		const downloadingCount = Object.values(updatedTasks).filter(t => t.status === 'downloading').length
		
		if (downloadingCount < concurrency) {
			const nextTask = Object.values(updatedTasks).find(t => t.status === 'waiting')
			if (nextTask) {
				startDownload(nextTask.track)
			}
		}
	},

	removeTask: (trackId) => {
		const { tasks } = get()
		const newTasks = { ...tasks }
		if (newTasks[trackId]?.jobId) {
			RNFS.stopDownload(newTasks[trackId].jobId!)
		}
		delete newTasks[trackId]
		set({ tasks: newTasks })
	},

	clearQueueByTracks: (trackIds: string[]) => {
		const { tasks } = get()
		const newTasks = { ...tasks }
		trackIds.forEach((id) => {
			if (newTasks[id]) {
				if (newTasks[id].status === 'downloading' && newTasks[id].jobId) {
					RNFS.stopDownload(newTasks[id].jobId!)
				}
				delete newTasks[id]
			}
		})
		set({ tasks: newTasks })
		processNext()
	}
}))

async function startDownload(track: Track) {
	const store = useDownloadStore.getState()
	if (store.isPaused) return

	// 获取下载 URL
	let downloadUrl = track.url
	if (!downloadUrl || downloadUrl === 'Unknown' || downloadUrl.includes('fake')) {
		try {
			const nowMusicApi = (await import('@/helpers/trackPlayerIndex')).musicApiSelectedStore.getValue()
			const quality = (await import('@/helpers/trackPlayerIndex')).qualityStore.getValue()
			if (nowMusicApi) {
				downloadUrl = await nowMusicApi.getMusicUrl(track.title, track.artist, track.id, quality)
			}
		} catch (error) {
			logError('获取下载链接失败:', error)
		}
	}

	if (!downloadUrl || downloadUrl === 'Unknown') {
		updateTaskStatus(track.id, 'failed')
		processNext()
		return
	}

	// 使用统一的文件路径生成逻辑
	const myTrackPlayer = (await import('@/helpers/trackPlayerIndex'))
	const localPath = myTrackPlayer.getLocalFilePath(track as any)
	
	// 确保目录存在
	const dirInfo = await FileSystem.getInfoAsync(cacheDir)
	if (!dirInfo.exists) {
		await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true })
	}

	const downloadOptions: RNFS.DownloadFileOptions = {
		fromUrl: downloadUrl,
		toFile: localPath,
		progressDivider: 1,
		progress: (res) => {
			const progress = res.bytesWritten / res.contentLength
			useDownloadStore.setState((state) => ({
				tasks: {
					...state.tasks,
					[track.id]: { ...state.tasks[track.id], progress }
				}
			}))
		},
	}

	try {
		const { jobId, promise } = RNFS.downloadFile(downloadOptions)
		
		useDownloadStore.setState((state) => ({
			tasks: {
				...state.tasks,
				[track.id]: { ...state.tasks[track.id], status: 'downloading', jobId }
			}
		}))

		const result = await promise
		if (result.statusCode === 200) {
			updateTaskStatus(track.id, 'completed')
			// 导入到本地库
			const myTrackPlayer = (await import('@/helpers/trackPlayerIndex')).default
			await myTrackPlayer.addImportedLocalMusic([{ ...track, url: localPath } as any], false)
		} else {
			updateTaskStatus(track.id, 'failed')
		}
	} catch (error) {
		logError('下载出错:', error)
		updateTaskStatus(track.id, 'failed')
	} finally {
		processNext()
	}
}

function updateTaskStatus(trackId: string, status: DownloadTask['status']) {
	useDownloadStore.setState((state) => {
		if (!state.tasks[trackId]) return state
		return {
			tasks: {
				...state.tasks,
				[trackId]: { ...state.tasks[trackId], status, progress: status === 'completed' ? 1 : state.tasks[trackId].progress }
			}
		}
	})
}

function processNext() {
	const store = useDownloadStore.getState()
	if (store.isPaused) return

	const activeCount = Object.values(store.tasks).filter(t => t.status === 'downloading').length
	if (activeCount < store.concurrency) {
		const nextTask = Object.values(store.tasks).find(t => t.status === 'waiting')
		if (nextTask) {
			startDownload(nextTask.track)
		}
	}
}
