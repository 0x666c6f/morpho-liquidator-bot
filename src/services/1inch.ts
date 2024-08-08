import { Address } from "viem"
import { CHAIN_ID } from "../constants"
import { setTimeout } from "timers/promises"

const apiBaseUrl = `https://api.1inch.dev/swap/v6.0/${CHAIN_ID}`
const headers = { Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`, accept: "application/json" }

export interface SelectedProtocol {
  name: string
  part: number
  fromTokenAddress: Address
  toTokenAddress: Address
}

export interface QuoteResponse {
  srcToken: TokenInfo
  dstToken: TokenInfo
  dstAmount: string
  protocols: SelectedProtocol[]
  gas: number
}

export interface TokenInfo {
  address: Address
  symbol: string
  name: string
  decimals: number
  logoURI: string
  domainVersion?: string
  eip2612?: boolean
  isFoT?: boolean
  tags?: string[]
}

export interface SwapCalldata {
  from: Address
  to: Address
  data: Address
  value: string
  gasPrice: string
  gas: number
}

export interface SwapResponse {
  srcToken: TokenInfo
  dstToken: TokenInfo
  dstAmount: string
  protocols: SelectedProtocol[]
  tx: SwapCalldata
}

const MAX_RETRIES = 5
const BASE_DELAY = 5000

async function fetchWithBackoff(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
  try {
    const response = await fetch(url, options)
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 60000)
      console.log(`Rate limited. Retrying in ${delay}ms`)
      await setTimeout(delay)
      return fetchWithBackoff(url, options, retryCount + 1)
    }
    return response
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount) + Math.random() * 1000, 60000)
      console.log(`Network error. Retrying in ${delay}ms`)
      await setTimeout(delay)
      return fetchWithBackoff(url, options, retryCount + 1)
    }
    throw error
  }
}

export async function getQuote(fromToken: string, toToken: string, amount: string): Promise<QuoteResponse> {
  const url = `${apiBaseUrl}/quote?src=${fromToken}&dst=${toToken}&amount=${amount}&includeGas=true`
  const response = await fetchWithBackoff(url, { method: "GET", headers: headers })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to get quote: ${response.statusText}: ${JSON.stringify(json)}`)
  }

  return json as QuoteResponse
}

export async function getSwapCalldata(
  from: string,
  fromToken: string,
  toToken: string,
  amount: string
): Promise<SwapResponse> {
  const params = new URLSearchParams({
    src: fromToken,
    dst: toToken,
    amount: amount,
    from: from,
    origin: from,
    slippage: "10",
    includeGas: "true",
    disableEstimate: "true",
    includeTokensInfo: "true",
  })

  const url = `${apiBaseUrl}/swap?${params.toString()}`

  const response = await fetchWithBackoff(url, {
    method: "GET",
    headers: headers,
  })
  const json = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to get swap calldata: ${response.statusText}: ${JSON.stringify(json)}`)
  }

  return json as SwapResponse
}
