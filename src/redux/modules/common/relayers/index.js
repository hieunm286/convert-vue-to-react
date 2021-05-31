import * as RelayersAction from './relayerSlice'

const init = (store) => {
    return store.dispatch(RelayersAction.init())
}

export default init;