import { Stack } from 'expo-router'

import { StackScreenWithSearchBar } from '@/constants/layout'
import { defaultStyles } from '@/styles'
import { View } from 'react-native'

const PlaylistsScreenLayout = () => {
	return (
		<View style={defaultStyles.container}>
			<Stack>
				<Stack.Screen
					name="index"
					options={{
						...StackScreenWithSearchBar,
						headerTitle: '歌单',
					}}
				/>
			</Stack>
		</View>
	)
}

export default PlaylistsScreenLayout
