import * as BlockAction from './blockSlice'

const init = (store) => {
    return store.dispatch(BlockAction.init())
}

export default init;