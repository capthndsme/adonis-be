import { useEffect, useState } from "react";

export const DelayRender = ({ children, delay = 500 }: { children: JSX.Element; delay?: number }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return show ? children : null;
};
