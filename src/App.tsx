import React, { useEffect, useState } from "react";
import SpAmountSelect from "./components/SpAmountSelect";
import SpTokenSend from "./components/SpTokenSend";
import "./scss/app.scss";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import SpAccountList from "./components/SpAccountList";
import { useDispatch } from "react-redux";
import transferInit from "./redux/modules/common/transfers";
import blocksInit from "./redux/modules/common/blocks";
import relayersInit from "./redux/modules/common/relayers";
import { store } from "./app/store";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import SpLayout from "./components/SpLayout";
import SpWallet from "./components/SpWallet";
import Sidebar from "./layout/SpSidebar";
import * as envActions from "./redux/modules/common/env/envSlice";
declare global {
  interface Window {
    keplr: any;
    getOfflineSigner: (string) => OfflineDirectSigner;
  }
}

function App() {
  const [initialized, setInitialized] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    transferInit(store);
    blocksInit(store);
    relayersInit(store);
  });

  useEffect(() => {
    const created = async () => {
      try {
        await dispatch(envActions.init());
        setInitialized(true);
      } catch (err) {
        console.log(err);
      }
    };

    created();
  }, []);

  console.log(initialized);

  return (
    <Router>
      {initialized && (
        <div v-if="initialized">
          <SpWallet
            // ref="wallet"
            // v-on:dropdown-opened="$refs.menu.closeDropdown()"
          />
          <SpLayout />
            {/* <template v-slot:sidebar>
              <Sidebar />
            </template>
            <template v-slot:content>
              <router-view />
            </template> */}
          {/* </SpLayout> */}
        </div>
      )}
    </Router>
  );
}

export default App;
