import { AlpacaClient } from './client'
import { AlpacaStream } from './stream'

export { AlpacaClient }
export { AlpacaStream }

export default {
  AlpacaClient: AlpacaClient,
  AlpacaStream: AlpacaStream,
}

export {
  Account,
  Order,
  Position,
  Asset,
  Watchlist,
  Calendar,
  Clock,
  DefaultCredentials,
  OAuthCredentials,
  AccountConfigurations,
  NonTradeActivity,
  TradeActivity,
  PortfolioHistory,
  Bar,
  LastQuote,
  LastTrade,
} from './entities'

export {
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
  GetLastTrade,
  GetLastQuote,
} from './params'
