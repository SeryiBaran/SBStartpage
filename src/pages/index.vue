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

const newsNumber = 10

const queryClient = useQueryClient()

function fetchNewsIDs() {
  return ky.get('https://hacker-news.firebaseio.com/v0/topstories.json').json<NewsItem['id'][]>()
}

function fetchNewsItemById(id: NewsItem['id']) {
  return ky.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).json<NewsItem>()
}

// topNewsIDsRequest = { isPending, isError, data, error }
const { isPending, data } = useQuery({
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

const searchText = ref('')

function handleSubmit(event: Event) {
  event.preventDefault()

  window.location.href = `https://www.google.com/search?q=${searchText.value}`
}
</script>

<template>
  <div class="mt-24vh max-w-[48rem] w-full flex flex-col gap-6">
    <a class="i-carbon-campsite link_without_effects mx-auto text-8xl" href="https://github.com/antfu/vitesse-lite" />
    <form class="w-full" @submit="handleSubmit">
      <input v-model="searchText" autofocus type="text" class="input w-full" placeholder="Write a query...">
    </form>
    <h2 class="mt-10 text-xl">
      Hacker News:
    </h2>
    <template v-if="isPending || newsItemsQueriesIsPending">
      <p>News list is loading...</p>
    </template>
    <template v-else-if="data">
      <ul class="">
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
</template>
