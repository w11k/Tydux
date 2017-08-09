import {Actions, enableDevelopmentMode, Store} from "./Store";


describe("Actions sanity tests", function () {

    beforeEach(function () {
        enableDevelopmentMode();
    });

    it("can not change the state asynchronously", function (done) {
        class TestActions extends Actions<{ n1: number }> {
            action1() {
                setTimeout(() => {
                    assert.throws(() => this.state);
                    done();
                }, 0);
            }
        }

        const store = new Store(new TestActions(), {n1: 0});
        store.dispatch.action1();
    });

});
