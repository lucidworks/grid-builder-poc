import { h } from "@stencil/core";
export class DashboardWidget {
    render() {
        return (h("div", { key: '431a2e029e79be8284518d88de03a04c1f3234d2', class: "dashboard-widget" }, h("div", { key: '6d4295ed67c79d361b9f37a3aaec40f5da75f7e4', class: "stats-row" }, h("div", { key: '66cac43528f23e4d167b98ead648d2f7343c9018', class: "stat-card" }, h("div", { key: '274f2d6e07eb04d6d9f4eceb2af231c22b936b85', class: "stat-label" }, "Users"), h("div", { key: 'ae7f7a62301fb4f0601adf38c81735f619584d43', class: "stat-value stat-primary" }, "2,547")), h("div", { key: '2db411f161da2db867e23d8a041b94f67a097813', class: "stat-card" }, h("div", { key: '94d45ea168e45c9fe6d1bb4b2342888f808c4318', class: "stat-label" }, "Revenue"), h("div", { key: 'ec8bcd6b9dd8c71c2db08e02d7067fa70f3421f6', class: "stat-value stat-success" }, "$12.4K"))), h("div", { key: 'f262e602b3b9d7619c5a3ab59e6d1e7eb20e6b81', class: "chart-container" }, h("div", { key: '7fa3491dcf276ecf7ba5dfc776700582a6923d8b', class: "chart-title" }, "Activity Chart"), h("div", { key: 'a6fa179d82cd78a7639cbf7107de22169290a74c', class: "chart-bars" }, h("div", { key: '65e65f8d9e8cfab524d15e0df10916cd759da6fc', class: "chart-bar", style: { height: '60%' } }), h("div", { key: '3272c79fceaebfc72982b916e00fe6aff38fdebd', class: "chart-bar", style: { height: '80%' } }), h("div", { key: '7f99cfe435e4a1ba929d3cdd9d1aaeb01565b93b', class: "chart-bar", style: { height: '40%' } }), h("div", { key: '3f4be5e2700aa68241ad408d30fc586e4b5c4906', class: "chart-bar", style: { height: '90%' } }), h("div", { key: '56eb07f55a8cce504bf6950820c2f5c5c8e779d4', class: "chart-bar", style: { height: '70%' } }), h("div", { key: '9d23f857c84cc7defc8b412610be20974cdda68f', class: "chart-bar", style: { height: '85%' } }), h("div", { key: '013027d1d04a0a4d024297b5889f59345c10ffaf', class: "chart-bar", style: { height: '95%' } }))), h("div", { key: 'c3845b684312cc2d38a6606481e19d66bb158af1', class: "metrics-list" }, h("div", { key: '5a69450c201637d8c586382137d0cae387b26aef' }, "\u2022 24 active sessions"), h("div", { key: 'af502790015d8ee7fa66aa4842c28c6107789262' }, "\u2022 156 page views"), h("div", { key: 'f6fc4b9e6211c5d33a1a6b13534161e663243e73' }, "\u2022 89% bounce rate"))));
    }
    static get is() { return "dashboard-widget"; }
    static get originalStyleUrls() {
        return {
            "$": ["dashboard-widget.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["dashboard-widget.css"]
        };
    }
}
//# sourceMappingURL=dashboard-widget.js.map
