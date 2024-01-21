<script setup lang="ts">
import dayjs from 'dayjs'
import {
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import ky from 'ky'
import type { NewsItem } from '~/types'

defineOptions({
  name: 'IndexPage',
})

const newsNumber = 16

const queryClient = useQueryClient()

function fetchNewsIDs() {
  return ky.get('https://hacker-news.firebaseio.com/v0/topstories.json').json<NewsItem['id'][]>()
}

function fetchNewsItemById(id: NewsItem['id']) {
  return ky.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).json<NewsItem>()
}

// topNewsIDsRequest = { isPending, isError, data, error }
const { data, isFetching } = useQuery({
  queryKey: ['newsIDs'],
  queryFn: fetchNewsIDs,
})

const newsItemsQueriesComputed = computed(() => (data.value?.slice(0, newsNumber - 1) || []).map((id) => {
  return {
    queryKey: ['newsItem', id],
    queryFn: () => fetchNewsItemById(id),
  }
}),
)
const newsItemsQueries = useQueries({ queries: newsItemsQueriesComputed })

const newsItemsQueriesIsPending = computed(() => newsItemsQueries.value.map(query => query.isPending).filter(Boolean).length)

const urlText = ref('')
const searchText = ref('')

function handleSubmit(event: Event) {
  event.preventDefault()

  let url

  if (urlText.value.trim().length) {
    url = urlText.value.trim()

    if (!(/:\/\//gi.test(urlText.value.trim())))
      url = `http://${urlText.value.trim()}`
  }
  else {
    url = `https://www.google.com/search?q=${searchText.value}`
  }

  window.location.href = url
}
</script>

<template>
  <main class="min-h-screen flex flex-col items-center p-4">
    <div class="mt-16vh max-w-[48rem] w-full flex flex-col gap-6">
      <a class="link_without_effects i-carbon-campsite mx-auto text-8xl" href="https://github.com/antfu/vitesse-lite" />
      <form class="w-full" @submit="handleSubmit">
        <input v-model="urlText" autofocus type="text" class="input w-full" placeholder="Enter an URL...">
        <input v-model="searchText" type="text" class="input mt-4 w-full" placeholder="...or write a query.">
        <button type="submit" class="hidden" />
      </form>
      <h2 class="mt-6 text-xl">
        Hacker News: <span v-if="isFetching || newsItemsQueriesIsPending" class="text-sm opacity-50">News list is updating...</span>
      </h2>
      <template v-if="!newsItemsQueriesIsPending && data">
        <ul>
          <li v-for="(newsItemQuery, index) in newsItemsQueries" :key="index" class="mb-4 w-full flex gap-4">
            <template v-if="newsItemQuery.isPending">
              <p>News data is loading...</p>
            </template>
            <template v-else-if="newsItemQuery.data">
              {{ dayjs.unix(newsItemQuery.data.time).format('DD.MM.YYYY') }} <a :href="newsItemQuery.data.url">{{ newsItemQuery.data.title }}</a>
            </template>
          </li>
        </ul>
      </template>
    </div>
  </main>
</template>
