import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=6db8f6f8"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=6db8f6f8"; const React = __vite__cjsImport1_react.__esModule ? __vite__cjsImport1_react.default : __vite__cjsImport1_react;
import __vite__cjsImport2_reactDom_client from "/node_modules/.vite/deps/react-dom_client.js?v=6db8f6f8"; const ReactDOM = __vite__cjsImport2_reactDom_client.__esModule ? __vite__cjsImport2_reactDom_client.default : __vite__cjsImport2_reactDom_client;
import { ChakraProvider, extendTheme } from "/node_modules/.vite/deps/@chakra-ui_react.js?v=6db8f6f8";
import { Provider } from "/node_modules/.vite/deps/react-redux.js?v=6db8f6f8";
import { store } from "/src/store/index.ts";
import App from "/src/App.tsx";
import "/src/index.css";
const theme = extendTheme({
  colors: {
    brand: {
      50: "#e0f7ff",
      100: "#b8e3ff",
      200: "#8eceff",
      300: "#64baff",
      400: "#3aa6ff",
      500: "#1192ff",
      600: "#0074e0",
      700: "#0057ad",
      800: "#003b7a",
      900: "#001e47"
    },
    quantum: {
      primary: "#3182CE",
      secondary: "#805AD5",
      accent: "#00B5D8",
      background: "#F7FAFC"
    }
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif'
  }
});
ReactDOM.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxDEV(React.StrictMode, { children: /* @__PURE__ */ jsxDEV(Provider, { store, children: /* @__PURE__ */ jsxDEV(ChakraProvider, { theme, children: /* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
    fileName: "C:/Users/rokai/OneDrive/Desktop/vs hello/QuantumFlow2.0/frontend/src/main.tsx",
    lineNumber: 41,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "C:/Users/rokai/OneDrive/Desktop/vs hello/QuantumFlow2.0/frontend/src/main.tsx",
    lineNumber: 40,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "C:/Users/rokai/OneDrive/Desktop/vs hello/QuantumFlow2.0/frontend/src/main.tsx",
    lineNumber: 39,
    columnNumber: 5
  }, this) }, void 0, false, {
    fileName: "C:/Users/rokai/OneDrive/Desktop/vs hello/QuantumFlow2.0/frontend/src/main.tsx",
    lineNumber: 38,
    columnNumber: 3
  }, this)
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBd0NRO0FBeENSLE9BQU9BLFdBQVc7QUFDbEIsT0FBT0MsY0FBYztBQUNyQixTQUFTQyxnQkFBZ0JDLG1CQUFtQjtBQUM1QyxTQUFTQyxnQkFBZ0I7QUFDekIsU0FBU0MsYUFBYTtBQUN0QixPQUFPQyxTQUFTO0FBQ2hCLE9BQU87QUFHUCxNQUFNQyxRQUFRSixZQUFZO0FBQUEsRUFDeEJLLFFBQVE7QUFBQSxJQUNOQyxPQUFPO0FBQUEsTUFDTCxJQUFJO0FBQUEsTUFDSixLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsSUFDUDtBQUFBLElBQ0FDLFNBQVM7QUFBQSxNQUNQQyxTQUFTO0FBQUEsTUFDVEMsV0FBVztBQUFBLE1BQ1hDLFFBQVE7QUFBQSxNQUNSQyxZQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUNBQyxPQUFPO0FBQUEsSUFDTEMsU0FBUztBQUFBLElBQ1RDLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQztBQUVEaEIsU0FBU2lCLFdBQVdDLFNBQVNDLGVBQWUsTUFBTSxDQUFFLEVBQUVDO0FBQUFBLEVBQ3BELHVCQUFDLE1BQU0sWUFBTixFQUNDLGlDQUFDLFlBQVMsT0FDUixpQ0FBQyxrQkFBZSxPQUNkLGlDQUFDLFNBQUQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFJLEtBRE47QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUVBLEtBSEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUlBLEtBTEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQU1BO0FBQ0YiLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0RE9NIiwiQ2hha3JhUHJvdmlkZXIiLCJleHRlbmRUaGVtZSIsIlByb3ZpZGVyIiwic3RvcmUiLCJBcHAiLCJ0aGVtZSIsImNvbG9ycyIsImJyYW5kIiwicXVhbnR1bSIsInByaW1hcnkiLCJzZWNvbmRhcnkiLCJhY2NlbnQiLCJiYWNrZ3JvdW5kIiwiZm9udHMiLCJoZWFkaW5nIiwiYm9keSIsImNyZWF0ZVJvb3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwicmVuZGVyIl0sInNvdXJjZXMiOlsibWFpbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xyXG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tL2NsaWVudCdcclxuaW1wb3J0IHsgQ2hha3JhUHJvdmlkZXIsIGV4dGVuZFRoZW1lIH0gZnJvbSAnQGNoYWtyYS11aS9yZWFjdCdcclxuaW1wb3J0IHsgUHJvdmlkZXIgfSBmcm9tICdyZWFjdC1yZWR1eCdcclxuaW1wb3J0IHsgc3RvcmUgfSBmcm9tICcuL3N0b3JlJ1xyXG5pbXBvcnQgQXBwIGZyb20gJy4vQXBwJ1xyXG5pbXBvcnQgJy4vaW5kZXguY3NzJ1xyXG5cclxuLy8gRXh0ZW5kIHRoZSB0aGVtZSB0byBpbmNsdWRlIGN1c3RvbSBjb2xvcnMsIGZvbnRzLCBldGNcclxuY29uc3QgdGhlbWUgPSBleHRlbmRUaGVtZSh7XHJcbiAgY29sb3JzOiB7XHJcbiAgICBicmFuZDoge1xyXG4gICAgICA1MDogJyNlMGY3ZmYnLFxyXG4gICAgICAxMDA6ICcjYjhlM2ZmJyxcclxuICAgICAgMjAwOiAnIzhlY2VmZicsXHJcbiAgICAgIDMwMDogJyM2NGJhZmYnLFxyXG4gICAgICA0MDA6ICcjM2FhNmZmJyxcclxuICAgICAgNTAwOiAnIzExOTJmZicsXHJcbiAgICAgIDYwMDogJyMwMDc0ZTAnLFxyXG4gICAgICA3MDA6ICcjMDA1N2FkJyxcclxuICAgICAgODAwOiAnIzAwM2I3YScsXHJcbiAgICAgIDkwMDogJyMwMDFlNDcnLFxyXG4gICAgfSxcclxuICAgIHF1YW50dW06IHtcclxuICAgICAgcHJpbWFyeTogJyMzMTgyQ0UnLFxyXG4gICAgICBzZWNvbmRhcnk6ICcjODA1QUQ1JyxcclxuICAgICAgYWNjZW50OiAnIzAwQjVEOCcsXHJcbiAgICAgIGJhY2tncm91bmQ6ICcjRjdGQUZDJyxcclxuICAgIH0sXHJcbiAgfSxcclxuICBmb250czoge1xyXG4gICAgaGVhZGluZzogJ1wiSW50ZXJcIiwgc2Fucy1zZXJpZicsXHJcbiAgICBib2R5OiAnXCJJbnRlclwiLCBzYW5zLXNlcmlmJyxcclxuICB9LFxyXG59KVxyXG5cclxuUmVhY3RET00uY3JlYXRlUm9vdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9vdCcpISkucmVuZGVyKFxyXG4gIDxSZWFjdC5TdHJpY3RNb2RlPlxyXG4gICAgPFByb3ZpZGVyIHN0b3JlPXtzdG9yZX0+XHJcbiAgICAgIDxDaGFrcmFQcm92aWRlciB0aGVtZT17dGhlbWV9PlxyXG4gICAgICAgIDxBcHAgLz5cclxuICAgICAgPC9DaGFrcmFQcm92aWRlcj5cclxuICAgIDwvUHJvdmlkZXI+XHJcbiAgPC9SZWFjdC5TdHJpY3RNb2RlPixcclxuKSJdLCJmaWxlIjoiQzovVXNlcnMvcm9rYWkvT25lRHJpdmUvRGVza3RvcC92cyBoZWxsby9RdWFudHVtRmxvdzIuMC9mcm9udGVuZC9zcmMvbWFpbi50c3gifQ==