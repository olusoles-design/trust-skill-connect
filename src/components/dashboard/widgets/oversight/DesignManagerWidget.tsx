import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenusManager } from "./design/MenusManager";
import { PagesManager } from "./design/PagesManager";
import { Layout, Menu } from "lucide-react";

export function DesignManagerWidget() {
  const [tab, setTab] = useState("menus");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-foreground">Design Manager</h3>
        <p className="text-sm text-muted-foreground">
          Manage navigation menus, pages, and content blocks across the platform.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="menus" className="gap-2">
            <Menu className="w-4 h-4" /> Menus
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2">
            <Layout className="w-4 h-4" /> Pages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menus">
          <MenusManager />
        </TabsContent>

        <TabsContent value="pages">
          <PagesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
