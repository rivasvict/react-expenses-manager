import React from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import homeIcon from "@iconify-icons/codicon/home";
import tagIcon from "@iconify-icons/codicon/tag";
import pieChartIcon from "@iconify-icons/codicon/pie-chart";
import syncIcon from "@iconify-icons/codicon/sync";
import databaseIcon from "@iconify-icons/codicon/database";
import accountIcon from "@iconify-icons/codicon/account";
import logoImage from "../../images/expenses_tracker_logo.png";
import { getInitials } from "../../helpers/general";
/**
 * TODO:
 * Reinstate the log-out action
 * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
 */
// import { logOut } from "../../redux/userManager/actionCreators";
import "./Header.scss";

// The dashboard lives on both "/" and "/dashboard".
const isHomeActive = (match, location) =>
  location.pathname === "/" || location.pathname.startsWith("/dashboard");

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: homeIcon, isActive: isHomeActive },
  { to: "/categories", label: "Categories", icon: tagIcon },
  { to: "/buckets", label: "Buckets", icon: pieChartIcon },
  { to: "/fixed-entries", label: "Fixed Entries", icon: syncIcon },
  {
    to: "/data-management",
    label: "Data",
    ariaLabel: "Data Management",
    icon: databaseIcon,
  },
];

// Account entry point (DESIGN §1): a circular icon-button in the app bar —
// a generic glyph when logged out, the user's initials when logged in.
// Present at every viewport, independent of the tab bar's collapse.
const AccountChip = ({ session }) => {
  const user = session?.user;
  const accountLabel = user
    ? `Account: ${user.firstName} ${user.lastName}`
    : "Account";
  return (
    <Link
      to="/account"
      className={`account-chip ${user ? "account-chip--logged-in" : ""}`}
      aria-label={accountLabel}
    >
      {user ? (
        <span aria-hidden="true">{getInitials(user)}</span>
      ) : (
        <Icon icon={accountIcon} className="account-chip__icon" aria-hidden="true" />
      )}
    </Link>
  );
};

/**
 * App bar with a single nav that adapts by viewport: an inline icon+label nav
 * on wide screens, a fixed bottom tab bar on narrow ones. The same links stay
 * in the DOM in both layouts.
 */
const Header = ({ session }) => (
  <header className="app-header">
    <div className="app-header__bar">
      <Link to="/" className="app-header__brand">
        <img src={logoImage} alt="Expenses tracker logo" className="logo" />
        <span className="app-header__name">Expenses Tracker</span>
      </Link>
      <nav className="app-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, ariaLabel, icon, isActive }) => (
          <NavLink
            key={to}
            to={to}
            exact={to === "/"}
            isActive={isActive}
            className="app-nav__item"
            activeClassName="app-nav__item--active"
            aria-label={ariaLabel}
          >
            <Icon icon={icon} className="app-nav__icon" aria-hidden="true" />
            <span className="app-nav__label">{label}</span>
          </NavLink>
        ))}
        {/**
         * TODO:
         * Reinstate the sign-out button
         * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
         */}
        {/* <Button block type='submit' variant='secondary' onClick={onLogOut}>Sign out</Button> */}
      </nav>
      <AccountChip session={session} />
    </div>
  </header>
);

const mapStateToProps = (state) => ({
  session: state.syncManager.session,
});

export default connect(mapStateToProps)(Header);
