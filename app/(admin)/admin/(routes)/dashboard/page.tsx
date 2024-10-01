import Link from "next/link";
import { ArrowUpRight, DollarSign, Download, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  
} from "@/components/ui/table";
import { getEbookDownloadGrowth } from "@/data/email-contact";
import { getEmailContactGrowth } from "@/data/email-contact";

const DashboardPage = async () => {
  const subscriptionWidget = await getEmailContactGrowth();
  const ebookDownloadedStats = await getEbookDownloadGrowth();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 md:pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div>Actions</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{subscriptionWidget.absoluteGrowth}
            </div>
            <p className="text-xs text-muted-foreground">
              +{subscriptionWidget.percentageGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ebook Downloaded
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{ebookDownloadedStats.absoluteGrowth}
            </div>
            <p className="text-xs text-muted-foreground">
              +{ebookDownloadedStats.percentageGrowth}% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2" x-chunk="dashboard-01-chunk-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>
                Recent subscriptions from your blog.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/admin/mails/audiences/all/contacts">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Interactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Liam Johnson</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      liam@example.com
                    </div>
                  </TableCell>
                  <TableCell>$250.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            {/* <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarImage src="/avatars/01.png" alt="Avatar" />
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  Olivia Martin
                </p>
                <p className="text-sm text-muted-foreground">
                  olivia.martin@email.com
                </p>
              </div>
              <div className="ml-auto font-medium">+$1,999.00</div>
            </div> */}
            No sales found
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
