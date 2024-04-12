import SidebarEbook from "./sidebar-ebook";
import SidebarSearch from "./sidebar-search";

const Sidebar = (): JSX.Element => (
  <div className="flex flex-col gap-y-4">
    <SidebarSearch />
    <SidebarEbook />
    {/* <SearchAlgolia />
    <FreeEbook />
    <RecentPosts />
    <Categories /> */}
  </div>
);

export default Sidebar;
