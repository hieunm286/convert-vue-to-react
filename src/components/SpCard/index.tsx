import React from "react";
import { Link } from "react-router-dom";

interface SpCardProp {
  type: string;
  icon: string;
  link?: string;
}

const SpCard: React.FC<SpCardProp> = ({ link, type, icon }) => {
  return (
    <>
      {link ? (
        <Link className={`sp-card ${"sp-card-" + type}`} to={link}>
          <div className="sp-card__icon">
            <span className={`sp-icon ${"sp-icon-" + icon}`} />
          </div>
          <div className="sp-card__text">
            <slot></slot>
          </div>
        </Link>
      ) : (
        <button className={`sp-card ${"sp-card-" + type}`}>
          <div className="sp-card__icon">
            <span className={`sp-icon ${"sp-icon-" + icon}`} />
          </div>
          <div className="sp-card__text">
            <slot></slot>
          </div>
        </button>
      )}
    </>
  );
};

export default SpCard;
