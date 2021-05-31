import React, { useState } from "react";
import SpLinkIcon from "../../components/SpLinkIcon";
import SpSidebar from "../../components/SpSidebar";
import SpStatusAPI from "../../components/SpStatusAPI";
import SpStatusRPC from "../../components/SpStatusRPC";
import SpStatusWS from "../../components/SpStatusWS";

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const sidebarO = () => {
    setSidebarOpen(true);
  };
  const sidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <SpSidebar sidebarOpen={sidebarOpen} sidebarO={sidebarO} sidebarClose={sidebarClose}>
        {/* <template v-slot:default>
          <SpLinkIcon link="/" text="Dashboard" icon="Dashboard" />
          <SpLinkIcon link="/types" text="Custom Type" icon="Form" />
          <SpLinkIcon link="/relayers" text="Relayers" icon="Transactions" />
          <div className="sp-dash"></div>
          <SpLinkIcon
            href="https://github.com/tendermint/starport"
            target="_blank"
            text="Documentation"
            icon="Docs"
          />
        </template> */}
        {/* <template v-slot:footer>
          <SpStatusAPI showText={sidebarOpen} />
          <SpStatusRPC showText={sidebarOpen} />
          <SpStatusWS showText={sidebarOpen} />
          <div className="sp-text">Build: v0.3.8</div>
        </template> */}
      </SpSidebar>
    </>
  );
};

export default Sidebar;
