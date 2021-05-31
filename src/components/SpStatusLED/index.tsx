import React from "react";

const SpStatusLED: React.FC<{ status?: boolean }> = ({ status }) => {
  return (
    <>
      <div className={`sp-status-led ${status && "sp-active"}`}></div>
    </>
  );
};

export default SpStatusLED;
