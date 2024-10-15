import { Link } from "react-router-dom";

export const NavButton = ({
   children,
   text,
   link,
   action,
}: {
   children: JSX.Element;
   text: string;
   link?: string;
   action?: () => void;
}): JSX.Element => {
   if (typeof link === "string") {
      return (
         <Link
            to={link}
            className="navItem"
         >
            <div className="navIconContainer">{children}</div>
            <div className="navText">{text}</div>
         </Link>
      );
   } else {
      return (
         <div
            className="navItem"
            onClick={() => {
               typeof action === "function" && action();
            }}
         >
            <div className="navIconContainer">{children}</div>
            <div className="navText">{text}</div>
         </div>
      );
   }
};
