import {Outlet} from "react-router-dom"

const DashboardLayout = () => {
    return <>
    <div className="dashboard-layout">
        <header>Navbar</header>

        <main>
            <aside>Icon Sidebar</aside>

            <aside>Navigation Panel</aside>

            <section>
                <Outlet />
            </section>
        </main>
    </div>
</>
}


export default DashboardLayout;