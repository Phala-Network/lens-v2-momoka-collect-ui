import { createClient } from 'urql'
import { API_URL } from '../../../api'

/* creates the API client */
export const client = createClient({
  url: API_URL
})
