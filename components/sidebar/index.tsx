import SidebarEbook from "./sidebar-ebook";
import SidebarLatestNews from "./sidebar-latest-news";
import SidebarSearch from "./sidebar-search";

const Sidebar = (): JSX.Element => (
  <div className="flex flex-col gap-y-4">
    <SidebarSearch />
    <SidebarEbook />
    {/* <SearchAlgolia /> */}
    {/* <FreeEbook /> */}
    <SidebarLatestNews />
    {/* <Categories /> */}
  </div>
);

export default Sidebar;
