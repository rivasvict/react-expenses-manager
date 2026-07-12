import { ActionCreators } from "./actions";
import LocalStorage from "../../services/storageSelector/LocalStorage";
import { setSession, clearSession } from "../../services/session";

/**
 * Attribution (AC-1.6, RFC §2.3): items created while logged in are stamped
 * with `addedBy` at the action-creator layer; logged out, the field is
 * absent entirely. Tested at the unit level because nothing renders the
 * stamp until the review wizard PR.
 */

const session = {
  // exp far in the future so getSession's local expiry check passes.
  token: `${window.btoa(
    JSON.stringify({ sub: "user-1", iat: 0, exp: 4102444800 })
  )}.sig`,
  user: {
    id: "user-1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  },
};

const janeStamp = { id: "user-1", name: "Jane" };

describe("addedBy attribution in expensesManager action creators", () => {
  let actionCreators;
  const dispatch = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    dispatch.mockClear();
    actionCreators = ActionCreators({ storage: LocalStorage() });
  });

  const entry = {
    amount: "12",
    description: "Lunch",
    type: "expense",
    date: 1770000000000,
    categories_path: ",eating out,",
  };

  describe("logged in", () => {
    beforeEach(() => setSession(session));
    afterEach(() => clearSession());

    it("stamps new balance entries", async () => {
      await actionCreators.addExpense({ entry, selectedDate: {} })(dispatch);
      const [stored] = JSON.parse(localStorage.getItem("balance"));
      expect(stored.addedBy).toEqual(janeStamp);
    });

    it("stamps the initial history state of a new fixed entry", async () => {
      await actionCreators.addFixedEntry({ entry, from: "2026-05" })(dispatch);
      const [fixed] = JSON.parse(localStorage.getItem("fixedEntries"));
      expect(fixed.history[0].addedBy).toEqual(janeStamp);
    });

    it("stamps forward-edit and removal states of a fixed entry", async () => {
      await actionCreators.addFixedEntry({ entry, from: "2026-05" })(dispatch);
      const [{ id }] = JSON.parse(localStorage.getItem("fixedEntries"));

      await actionCreators.editFixedEntry({
        id,
        from: "2026-06",
        amount: "20",
        description: "Lunch",
        categories_path: ",eating out,",
      })(dispatch);
      await actionCreators.removeFixedEntry({ id, from: "2026-07" })(dispatch);

      const [fixed] = JSON.parse(localStorage.getItem("fixedEntries"));
      const june = fixed.history.find((state) => state.from === "2026-06");
      const july = fixed.history.find((state) => state.from === "2026-07");
      expect(june.addedBy).toEqual(janeStamp);
      expect(july).toEqual({
        from: "2026-07",
        removed: true,
        addedBy: janeStamp,
      });
    });

    it("stamps new bucket and bucket-edit history states", async () => {
      await actionCreators.addBucket({ bucket: { Gym: 120 } })(dispatch);
      await actionCreators.editBucket({
        bucket: { Gym: 150 },
        selectedDate: { year: 2026, month: 5 },
      })(dispatch);

      const { Gym } = JSON.parse(localStorage.getItem("buckets"));
      expect(Gym[0].addedBy).toEqual(janeStamp);
      expect(Gym[1].addedBy).toEqual(janeStamp);
    });
  });

  describe("logged out", () => {
    it("adds no addedBy field anywhere", async () => {
      await actionCreators.addExpense({ entry, selectedDate: {} })(dispatch);
      await actionCreators.addFixedEntry({ entry, from: "2026-05" })(dispatch);
      await actionCreators.addBucket({ bucket: { Gym: 120 } })(dispatch);

      const [storedEntry] = JSON.parse(localStorage.getItem("balance"));
      const [fixed] = JSON.parse(localStorage.getItem("fixedEntries"));
      const { Gym } = JSON.parse(localStorage.getItem("buckets"));

      expect(storedEntry).not.toHaveProperty("addedBy");
      expect(fixed.history[0]).not.toHaveProperty("addedBy");
      expect(Gym[0]).not.toHaveProperty("addedBy");
    });
  });
});
