import React from "react";
import { Link } from "react-router-dom";

interface SpButtonProp {
  busy?: boolean;
  link?: string;
  href?: string;
  target?: string;
  type?: string;
  disabled?: boolean;
}

const SpButton: React.FC<SpButtonProp> = ({
  busy,
  link,
  href,
  target,
  type,
  disabled = false,
}) => {
  return (
    <>
      {link ? (
        <>
          {disabled ? (
            <>{link}</>
          ) : (
            <Link
              to={link}
              className={`sp-button ${busy ? "sp-button__progress" : ""} ${
                "sp-button-" + type
              }`}
            >
              <span className="sp-button__text">
                <slot></slot>
              </span>
              <div className="sp-button__loading">
                <div className="sp-icon sp-icon-Reload"></div>
              </div>
            </Link>
          )}
        </>
      ) : href ? (
        <>
          {disabled ? (
            <></>
          ) : (
            <a
              href={href}
              className={`sp-button ${busy ? "sp-button__progress" : ""} ${
                "sp-button-" + type
              }`}
              target={target}
            >
              <span className="sp-button__text">
                <slot></slot>
              </span>
              <div className="sp-button__loading">
                <div className="sp-icon sp-icon-Reload"></div>
              </div>
            </a>
          )}
        </>
      ) : (
        <button
          type="button"
          className={`sp-button ${busy ? "sp-button__progress" : ""} ${
            "sp-button-" + type
          }`}
          disabled={disabled}
        >
          <span className="sp-button__text">
            <slot></slot>
          </span>
          <div className="sp-button__loading">
            <div className="sp-icon sp-icon-Reload"></div>
          </div>
        </button>
      )}
    </>
  );
};

export default SpButton;
