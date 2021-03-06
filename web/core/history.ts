/* SPDX-FileCopyrightText: 2016-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import type {
  History as HistoryBase,
  Location as LocationBase,
  State,
  To,
} from "history";
import { Action } from "history";
import * as React from "react";

export type History = HistoryBase<State>;
export type Location = LocationBase<State>;

// Provide the default history object (for unit testing)
export const HistoryContext = React.createContext<History>({
  action: Action.Pop,
  location: { key: "", pathname: "/", search: "" },
} as History);

// Provide the default location object (for unit testing)
export const LocationContext = React.createContext<Location>({
  key: "",
  pathname: "/",
  search: "",
} as Location);

function isLeftClickEvent(event: React.MouseEvent<HTMLElement>) {
  return event.button === 0;
}

function isModifiedEvent(event: React.MouseEvent<HTMLElement>) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export function useHistory(): History {
  return React.useContext(HistoryContext);
}

export function useLocation(): Location {
  return React.useContext(LocationContext);
}

export function useURLSearchParams(): URLSearchParams {
  const { search } = React.useContext(LocationContext);
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function useURLSearchParam(name: string): Set<string> {
  const param = useURLSearchParams().get(name);
  return React.useMemo(() => new Set(param?.split(",") ?? []), [param]);
}

/**
 * Generates a new URL with added or removed URL search parameter.
 */
export function useGetSearchURL(
  name: string,
): (value?: string | null) => string {
  const location = React.useContext(LocationContext);
  const selected = useURLSearchParam(name);

  return React.useCallback(
    (value?: string | null) => {
      const params = new URLSearchParams(location.search);

      if (value) {
        if (selected.has(value)) {
          if (selected.size === 1) {
            params.delete(name);
          } else {
            const temp = new Set(selected);
            temp.delete(value);
            params.set(name, [...temp].sort().join(","));
          }
        } else {
          params.set(name, [...selected, value].sort().join(","));
        }
      }

      return `${location.pathname}?${params.toString().replace(/%2C/g, ",")}`;
    },
    [location.search, selected],
  );
}

export function useNavigate<T extends HTMLElement = HTMLAnchorElement>(
  method: "push" | "replace" = "push",
): (event: React.MouseEvent<T>) => void {
  const history = useHistory();

  return React.useCallback(
    (event: React.MouseEvent<T>): void => {
      if (
        event.defaultPrevented ||
        isModifiedEvent(event) ||
        !isLeftClickEvent(event)
      ) {
        return;
      }

      event.preventDefault();
      history[method]?.(event.currentTarget.getAttribute("href") as To);
    },
    [history],
  );
}
