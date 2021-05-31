import React from "react";

interface SpTypeProps {
  modulePath: string;
  moduleType: string;
}

const SpType: React.FC<SpTypeProps> = ({
  modulePath = "",
  moduleType = "",
}) => {
  return (
    <>
      <div>
        <div className="sp-type">
          <div className="sp-type__header sp-component-title">
            <h3>Custom type</h3>
            <span>|</span>
            <span>Create and edit a custom type form.</span>
          </div>

          <div className="sp-type__holder">
            {/* <div className="sp-type-form__holder">
              <SpTypeForm
                modulePath={modulePath}
                moduleType={moduleType}
                action="create"
                className="sp-type__create sp-shadow"
              />
            </div>
            <SpTypeList
              modulePath={modulePath}
              moduleType={moduleType}
              className="sp-type__list"
            /> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default SpType;
