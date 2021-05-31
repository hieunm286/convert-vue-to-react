import React from "react";
import { Link } from "react-router-dom";
interface SpLinkIconProp {
  link?: string;
  href?: string;
  target?: string;
  icon?: string;
  text: string;
}

const SpLinkIcon: React.FC<SpLinkIconProp> = (props) => {
  const { link, href, target, icon, text } = props;
  return (
    <>
      <div className="sp-link-icon">
        {link ? (
          <Link to={link} className="sp-link-icon-wrapper">
            <div className="sp-link-icon__icon">
              {icon && <span className={`sp-icon sp-icon-${icon}`} />}
            </div>
            <div className="sp-link-icon__text">{text}</div>
          </Link>
        ) : href ? (
          <a className="sp-link-icon-wrapper" href={href} target={target}>
            <div className="sp-link-icon__icon">
              {icon && <span className={`sp-icon sp-icon-${icon}`} />}
            </div>
            <div className="sp-link-icon__text">{text}</div>
          </a>
        ) : (
          <a className="sp-link-icon-wrapper">
            <div className="sp-link-icon__icon">
              {icon && <span className={`sp-icon sp-icon-${icon}`} />}
            </div>
            <div className="sp-link-icon__text">{text}</div>
          </a>
        )}
      </div>
    </>
  );
};

export default SpLinkIcon;
