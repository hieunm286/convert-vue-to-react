import React, { useEffect, useState } from "react";
import SpLinkIcon from "../SpLinkIcon";
import SpStatusAPI from "../SpStatusAPI";
import SpStatusRPC from "../SpStatusRPC";
import SpStatusWS from "../SpStatusWS";

const SpSidebar: React.FC<{ sidebarOpen: boolean; sidebarClose: () => void; sidebarO: () => void; }> = ({ sidebarOpen, sidebarClose, sidebarO }) => {
  const [opened, setOpened] = useState<boolean>(true);
  const [mobOpened, setMobOpened] = useState<boolean>(false);

  useEffect(() => {
    if (opened) {
      sidebarO()
    } else {
      sidebarClose()
    }
  }, [opened, sidebarClose, sidebarO])

  const toggleOpen = (): void => {
    setOpened(!opened);
  };

  const toggleMobOpen = (): void => {
    setMobOpened(!mobOpened);
  };

  return (
    <>
      <div
        className={`sp-sidebar ${opened && "sp-opened"} ${
          mobOpened && "sp-mob-opened"
        }`}
      >
        <div className="sp-hamburger sp-shadow" onClick={toggleMobOpen}>
          <div className="sp-icon sp-icon-Hamburger"></div>
        </div>
        {/* <div className="sp-sidebar__header" v-if="$slots.header">
          <slot name="header"></slot>
        </div> */}
        <div className="sp-sidebar__content">
          {/* <slot></slot> */}
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
        </div>
        <div className="sp-sidebar__footer">
          {/* <slot name="footer"></slot> */}
          <SpStatusAPI showText={sidebarOpen} />
          <SpStatusRPC showText={sidebarOpen} />
          <SpStatusWS showText={sidebarOpen} />
        </div>
      </div>
    </>
  );
};

export default SpSidebar;
