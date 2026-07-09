import { startLogin } from "./sso";
import { useT } from "../i18n";

export function LoginButton() {
  const t = useT();
  return (
    <button
      type="button"
      className="btn-primary"
      onClick={() => {
        startLogin().catch((e) => console.error(e));
      }}
    >
      <span className="btn-primary__icon" aria-hidden="true">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      </span>
      {t("BTN_SIGN_IN_WITH_BLOCKS")}
      <span className="btn-primary__arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}