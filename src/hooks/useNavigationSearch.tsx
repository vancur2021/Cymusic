import { colors } from '@/constants/tokens'
import { nowLanguage } from '@/utils/i18n'
import { useNavigation } from 'expo-router'
import { debounce } from 'lodash'
import { useCallback, useLayoutEffect, useState } from 'react'
import { SearchBarProps } from 'react-native-screens'

const defaultSearchOptions: SearchBarProps = {
	tintColor: colors.primary,
	hideWhenScrolling: false,
}

export const useNavigationSearch = ({
	searchBarOptions,
	onFocus,
	onBlur,
	onCancel,
	searchOnSubmit = false,
}: {
	searchBarOptions?: SearchBarProps
	onFocus?: () => void
	onBlur?: () => void
	onCancel?: () => void
	searchOnSubmit?: boolean
}) => {
	const [search, setSearch] = useState('')

	const navigation = useNavigation()
	const language = nowLanguage.useValue()

	const debouncedSetSearch = useCallback(
		debounce((text) => {
			setSearch(text)
		}, 400),
		[],
	)

	const handleOnChangeText: SearchBarProps['onChangeText'] = ({ nativeEvent: { text } }) => {
		if (!searchOnSubmit) {
			debouncedSetSearch(text)
		} else if (text === '') {
			// 即使是提交模式，清空输入框时也应该立即清空搜索状态
			setSearch('')
		}
	}

	const handleOnSearchButtonPress: SearchBarProps['onSearchButtonPress'] = ({
		nativeEvent: { text },
	}) => {
		if (searchOnSubmit) {
			setSearch(text)
		}
	}

	useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				...defaultSearchOptions,
				...searchBarOptions,
				onChangeText: handleOnChangeText,
				onSearchButtonPress: handleOnSearchButtonPress,
				onFocus: onFocus,
				onBlur: onBlur,
				onCancelButtonPress: (e) => {
					setSearch('') // 取消时清空
					onCancel?.()
					searchBarOptions?.onCancelButtonPress?.(e)
				},
			},
		})
	}, [navigation, searchBarOptions, onFocus, onBlur, onCancel, searchOnSubmit])

	return search
}
