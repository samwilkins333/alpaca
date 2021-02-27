import Bottleneck from 'bottleneck'

import qs from 'qs'
import isofetch from 'isomorphic-unfetch'

import urls from './urls.js'
import parse from './parse.js'

import {
  RawAccount,
  Account,
  Order,
  Position,
  Asset,
  Watchlist,
  Calendar,
  Clock,
  AccountConfigurations,
  PortfolioHistory,
  RawOrder,
  RawPosition,
  RawActivity,
  Activity,
  DefaultCredentials,
  OAuthCredentials,
  OrderCancelation,
  RawOrderCancelation,
  PageOfTrades,
  PageOfQuotes,
  PageOfBars,
} from './entities.js'

import {
  GetOrder,
  GetOrders,
  PlaceOrder,
  ReplaceOrder,
  CancelOrder,
  GetPosition,
  ClosePosition,
  GetAsset,
  GetAssets,
  GetWatchList,
  CreateWatchList,
  UpdateWatchList,
  AddToWatchList,
  RemoveFromWatchList,
  DeleteWatchList,
  GetCalendar,
  UpdateAccountConfigurations,
  GetAccountActivities,
  GetPortfolioHistory,
  GetBars,
  GetTrades,
  GetQuotes,
} from './params.js'

const unifetch = typeof fetch !== 'undefined' ? fetch : isofetch
export class AlpacaClient {
  private limiter = new Bottleneck({
    reservoir: 200, // initial value
    reservoirRefreshAmount: 200,
    reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
    // also use maxConcurrent and/or minTime for safety
    maxConcurrent: 1,
    minTime: 200,
  })

  constructor(
    public params: {
      credentials?: DefaultCredentials | OAuthCredentials
      rate_limit?: boolean
    },
  ) {
    if (
      // if not specified
      !('paper' in params.credentials) &&
      // and live key isn't already provided
      !('key' in params.credentials && params.credentials.key.startsWith('A'))
    ) {
      params.credentials['paper'] = true
    }

    if (
      'access_token' in params.credentials &&
      ('key' in params.credentials || 'secret' in params.credentials)
    ) {
      throw new Error(
        "can't create client with both default and oauth credentials",
      )
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getAccount()
      return true
    } catch {
      return false
    }
  }

  async getAccount(): Promise<Account> {
    return parse.account(
      await this.request<RawAccount>({
        method: 'GET',
        url: `${urls.rest.account}/account`,
      }),
    )
  }

  async getOrder(params: GetOrder): Promise<Order> {
    return parse.order(
      await this.request<RawOrder>({
        method: 'GET',
        url: `${urls.rest.account}/orders/${
          params.order_id || params.client_order_id
        }`,
        data: { nested: params.nested },
      }),
    )
  }

  async getOrders(params?: GetOrders): Promise<Order[]> {
    return parse.orders(
      await this.request<RawOrder[]>({
        method: 'GET',
        url: `${urls.rest.account}/orders`,
        data: params,
      }),
    )
  }

  async placeOrder(params: PlaceOrder): Promise<Order> {
    return parse.order(
      await this.request<RawOrder>({
        method: 'POST',
        url: `${urls.rest.account}/orders`,
        data: params,
      }),
    )
  }

  async replaceOrder(params: ReplaceOrder): Promise<Order> {
    return parse.order(
      await this.request<RawOrder>({
        method: 'PATCH',
        url: `${urls.rest.account}/orders/${params.order_id}`,
        data: params,
      }),
    )
  }

  cancelOrder(params: CancelOrder): Promise<Boolean> {
    return this.request<Boolean>({
      method: 'DELETE',
      url: `${urls.rest.account}/orders/${params.order_id}`,
    })
  }

  async cancelOrders(): Promise<OrderCancelation[]> {
    return parse.canceled_orders(
      await this.request<RawOrderCancelation[]>({
        method: 'DELETE',
        url: `${urls.rest.account}/orders`,
      }),
    )
  }

  async getPosition(params: GetPosition): Promise<Position> {
    return parse.position(
      await this.request<RawPosition>({
        method: 'GET',
        url: `${urls.rest.account}/positions/${params.symbol}`,
      }),
    )
  }

  async getPositions(): Promise<Position[]> {
    return parse.positions(
      await this.request<RawPosition[]>({
        method: 'GET',
        url: `${urls.rest.account}/positions`,
      }),
    )
  }

  async closePosition(params: ClosePosition): Promise<Order> {
    return parse.order(
      await this.request<RawOrder>({
        method: 'DELETE',
        url: `${urls.rest.account}/positions/${params.symbol}`,
      }),
    )
  }

  async closePositions(): Promise<Order[]> {
    return parse.orders(
      await this.request<RawOrder[]>({
        method: 'DELETE',
        url: `${urls.rest.account}/positions`,
      }),
    )
  }

  getAsset(params: GetAsset): Promise<Asset> {
    return this.request({
      method: 'GET',
      url: `${urls.rest.account}/assets/${params.asset_id_or_symbol}`,
    })
  }

  getAssets(params?: GetAssets): Promise<Asset[]> {
    return this.request({
      method: 'GET',
      url: `${urls.rest.account}/assets`,
      data: params,
    })
  }

  getWatchlist(params: GetWatchList): Promise<Watchlist> {
    return this.request({
      method: 'GET',
      url: `${urls.rest.account}/watchlists/${params.uuid}`,
    })
  }

  getWatchlists(): Promise<Watchlist[]> {
    return this.request({
      method: 'GET',
      url: `${urls.rest.account}/watchlists`,
    })
  }

  createWatchlist(params: CreateWatchList): Promise<Watchlist[]> {
    return this.request({
      method: 'POST',
      url: `${urls.rest.account}/watchlists`,
      data: params,
    })
  }

  updateWatchlist(params: UpdateWatchList): Promise<Watchlist> {
    return this.request({
      method: 'PUT',
      url: `${urls.rest.account}/watchlists/${params.uuid}`,
      data: params,
    })
  }

  addToWatchlist(params: AddToWatchList): Promise<Watchlist> {
    return this.request({
      method: 'POST',
      url: `${urls.rest.account}/watchlists/${params.uuid}`,
      data: params,
    })
  }

  removeFromWatchlist(params: RemoveFromWatchList): Promise<Boolean> {
    return this.request<Boolean>({
      method: 'DELETE',
      url: `${urls.rest.account}/watchlists/${params.uuid}/${params.symbol}`,
    })
  }

  deleteWatchlist(params: DeleteWatchList): Promise<Boolean> {
    return this.request<Boolean>({
      method: 'DELETE',
      url: `${urls.rest.account}/watchlists/${params.uuid}`,
    })
  }

  getCalendar(params?: GetCalendar): Promise<Calendar[]> {
    return this.request({
      method: 'GET',
      url: `${urls.rest.account}/calendar`,
      data: params,
    })
  }

  async getClock(): Promise<Clock> {
    return parse.clock(
      await this.request({
        method: 'GET',
        url: `${urls.rest.account}/clock`,
      }),
    )
  }

  getAccountConfigurations(): Promise<AccountConfigurations> {
    return this.request({
      method: 'GET',
      url: `${urls.rest.account}/account/configurations`,
    })
  }

  updateAccountConfigurations(
    params: UpdateAccountConfigurations,
  ): Promise<AccountConfigurations> {
    return this.request({
      method: 'PATCH',
      url: `${urls.rest.account}/account/configurations`,
      data: params,
    })
  }

  async getAccountActivities(
    params: GetAccountActivities,
  ): Promise<Activity[]> {
    if (params.activity_types && Array.isArray(params.activity_types)) {
      params.activity_types = params.activity_types.join(',')
    }

    return parse.activities(
      await this.request<RawActivity[]>({
        method: 'GET',
        url: `${urls.rest.account}/account/activities${
          params.activity_type ? '/'.concat(params.activity_type) : ''
        }`,
        data: { ...params, activity_type: undefined },
      }),
    )
  }

  getPortfolioHistory(params?: GetPortfolioHistory): Promise<PortfolioHistory> {
    return this.request({
      method: 'GET',
      url: `${urls.rest.account}/account/portfolio/history`,
      data: params,
    })
  }

  async getTrades(params: GetTrades): Promise<PageOfTrades> {
    return parse.pageOfTrades(
      await this.request({
        method: 'GET',
        url: `${urls.rest.market_data}/stocks/${params.symbol}/trades`,
        data: { ...params, symbol: undefined },
      }),
    )
  }

  async getQuotes(params: GetQuotes): Promise<PageOfQuotes> {
    return parse.pageOfQuotes(
      await this.request({
        method: 'GET',
        url: `${urls.rest.market_data}/stocks/${params.symbol}/quotes`,
        data: { ...params, symbol: undefined },
      }),
    )
  }

  async getBars(params: GetBars): Promise<PageOfBars> {
    return parse.pageOfBars(
      await this.request({
        method: 'GET',
        url: `${urls.rest.market_data}/stocks/${params.symbol}/bars`,
        data: { ...params, symbol: undefined },
      }),
    )
  }

  private async request<T = any>(params: {
    method: 'GET' | 'DELETE' | 'PUT' | 'PATCH' | 'POST'
    url: string
    data?: { [key: string]: any }
    isJson?: boolean
  }): Promise<T> {
    let headers: any = {}

    if ('access_token' in this.params.credentials) {
      headers[
        'Authorization'
      ] = `Bearer ${this.params.credentials.access_token}`
    } else {
      headers['APCA-API-KEY-ID'] = this.params.credentials.key
      headers['APCA-API-SECRET-KEY'] = this.params.credentials.secret

      if (this.params.credentials.paper) {
        params.url = params.url.replace('api.', 'paper-api.')
      }
    }

    // translate dates to ISO strings
    for (let [key, value] of Object.entries(params.data)) {
      if (value instanceof Date) {
        params.data[key] = (value as Date).toISOString()
      }
    }

    let query = ''

    if (params.data) {
      if (params.method != 'POST' && params.method != 'PATCH') {
        query = '?'.concat(qs.stringify(params.data))
      }
    }

    const makeCall = () =>
        unifetch(params.url.concat(query), {
          method: params.method,
          headers,
          body: JSON.stringify(params.data),
        }),
      func = this.params.rate_limit
        ? () => this.limiter.schedule(makeCall)
        : makeCall

    let resp,
      result = {}

    try {
      resp = await func()

      if (!(params.isJson != undefined ? false : params.isJson)) {
        return resp.ok as any
      }

      result = await resp.json()
    } catch (e) {
      console.error(e)
      throw result
    }

    if ('code' in result || 'message' in result) {
      throw result
    }

    return result as any
  }
}
