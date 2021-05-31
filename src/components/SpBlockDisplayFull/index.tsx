import React from "react";

const SpBlockDisplayFull = ({ block }: { block?: any }) => {
  return (
    <>
      <div className="SpBlockDisplayFull">
        <pre>{block}</pre>
      </div>
    </>
  );
};

export default SpBlockDisplayFull;
