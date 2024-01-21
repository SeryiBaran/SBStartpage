import '@unocss/reset/tailwind.css'
import './css/main.css'
import 'uno.css'

import ky from 'ky'
import dayjs from 'dayjs'
import { persistentAtom } from '@nanostores/persistent'
import type { NewsItem } from './types'

const newsCount = 32
const newsRefetchTimeout = 1000 * 60 * 60

const searchForm = document.querySelector('#searchForm') as HTMLFormElement
const searchBox = document.querySelector('#searchBox') as HTMLInputElement
const newsLoader = document.querySelector('#newsLoader') as HTMLElement
const newsTableBody = document.querySelector('#newsTableBody') as HTMLTableElement

const persistSettings = {
  encode: JSON.stringify,
  decode: JSON.parse,
}

const $newsIDs = persistentAtom<number[]>('sbstartpage_newsIDs', [], persistSettings)
const $newsData = persistentAtom<NewsItem[]>('sbstartpage_newsData', [], persistSettings)

function renderNews(newsData: readonly NewsItem[]) {
  let newsTableBodyContent = ''

  newsData.forEach((newsItem) => {
    newsTableBodyContent += `
<tr>
  <td>${dayjs.unix(newsItem.time).format('DD.MM.YYYY')}</td><td><a href="${newsItem.url}">${newsItem.title}</a></td><td class="newsTableScoreColumn">${String(newsItem.score)}</td>
</tr>
`
  })

  newsTableBody.innerHTML = newsTableBodyContent
}

const $lastNewsFetch = persistentAtom<number>('sbstartpage_lastNewsFetch', 0, persistSettings)

searchForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const value = searchBox.value.trim()

  if (!value.length)
    return

  let url

  if (value.startsWith('/') || value.startsWith('\\'))
    url = `http://${value.substring(1)}`
  else
    url = `https://www.google.com/search?q=${value}`

  window.location.replace(url)
})

if ((Date.now() - newsRefetchTimeout) >= $lastNewsFetch.get()) {
  console.log('refetch!')
  $lastNewsFetch.set(Date.now())

  newsLoader.classList.remove('hidden')

  ky
    .get('https://hacker-news.firebaseio.com/v0/topstories.json')
    .json<NewsItem['id'][]>()
    .then((newsIDs) => {
      $newsIDs.set(newsIDs.slice(0, newsCount))
    })
}

$newsIDs.subscribe((value) => {
  const newsDataRequests = value
    .map((id: NewsItem['id']) => {
      return ky
        .get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .json<NewsItem>()
    })

  Promise.all(newsDataRequests).then((data) => {
    $newsData.set(data)
    newsLoader.classList.add('hidden')
  })
})

$newsData.subscribe(value => renderNews(value))
