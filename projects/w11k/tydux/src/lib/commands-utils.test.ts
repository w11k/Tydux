import {groupById, groupByUniqueId} from "./commands-utils";

describe("commands utils", () => {

    describe("groupByUniqueId", () => {

        it("groups list by id", () => {
            const list = [
                {id: 0, name: "a"},
                {id: 1, name: "b"},
                {id: 2, name: "c"},
            ];

            const grouped = groupByUniqueId(list, e => e.id);
            expect(grouped).toEqual({
                0: {id: 0, name: "a"},
                1: {id: 1, name: "b"},
                2: {id: 2, name: "c"}
            });
        });

        it("fails on duplicate id", () => {
            const list = [
                {id: 0, name: "a"},
                {id: 1, name: "b"},
                {id: 1, name: "c"},
            ];

            expect(() => groupByUniqueId(list, e => e.id))
                .toThrow("duplicate");
        });

    });

    describe("groupById", () => {

        it("groups list by id", () => {
            const list = [
                {key: 0, name: "a"},
                {key: 1, name: "b"},
                {key: 1, name: "c"},
            ];

            const grouped = groupById(list, e => e.key);
            expect(grouped).toEqual({
                0: [{key: 0, name: "a"}],
                1: [{key: 1, name: "b"}, {key: 1, name: "c"}]
            });
        });

    });

});
