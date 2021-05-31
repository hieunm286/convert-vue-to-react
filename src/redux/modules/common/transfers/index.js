import * as TransfersAction from './transferSlice'

const init = (store) => {
    return store.dispatch(TransfersAction.init())
}

export default init;