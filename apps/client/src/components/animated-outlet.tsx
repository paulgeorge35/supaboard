import { getRouterContext, Outlet } from "@tanstack/react-router";
import { motion, MotionProps, useIsPresent } from "framer-motion";
import cloneDeep from "lodash.clonedeep";
import { forwardRef, useContext, useRef } from "react";

interface AnimatedOutletProps {
    transitionProps: MotionProps;
}

const AnimatedOutlet = forwardRef<HTMLDivElement, AnimatedOutletProps>(({ transitionProps }, ref) => {
    const RouterContext = getRouterContext();

    const routerContext = useContext(RouterContext);

    const renderedContext = useRef(routerContext);

    const isPresent = useIsPresent();

    if (isPresent) {
        renderedContext.current = cloneDeep(routerContext);
    }

    return (
        <motion.div ref={ref} {...transitionProps}>
            <RouterContext.Provider value={renderedContext.current}>
                <Outlet />
            </RouterContext.Provider>
        </motion.div>
    );
});

AnimatedOutlet.displayName = "AnimatedOutlet";

export default AnimatedOutlet;