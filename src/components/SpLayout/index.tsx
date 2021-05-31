import React from "react";
import Sidebar from "../../layout/SpSidebar";
import HomePage from "../../pages/home";

const SpLayout = () => {
  return (
    <>
      <div className="sp-layout">
        {/* <slot name="sidebar"></slot> */}
        <Sidebar />
        <div className="sp-fill">
          {/* <slot name="content"></slot> */}
          <HomePage />
        </div>
      </div>
    </>
  );
};

export default SpLayout;
