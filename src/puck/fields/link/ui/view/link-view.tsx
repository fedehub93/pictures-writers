"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useDebounceValue } from "usehooks-ts";

import { CommandSelect } from "@/shared/components/command-select";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";
import { TextInput } from "@/puck/components/text-input";

import {
  type LinkProps,
  type SmartLinkType,
  getSmartLinkEntityId,
  getSmartLinkType,
  withLinkLabel,
  withSmartLinkTarget,
  withSmartLinkType,
} from "../../types";

const LINK_TYPE_OPTIONS: { value: SmartLinkType; label: string }[] = [
  { value: "external", label: "URL esterno" },
  { value: "page", label: "Pagina" },
  { value: "post", label: "Articolo" },
  { value: "product", label: "Prodotto" },
  { value: "category", label: "Categoria blog" },
  { value: "productCategory", label: "Categoria shop" },
];

const NEW_TAB_OPTIONS = [
  { title: "Stessa scheda", value: "same" },
  { title: "Nuova scheda", value: "new" },
] as const;

interface PickerOption {
  id: string;
  value: string;
  title: string;
}

interface LinkViewProps {
  state: LinkProps;
  onUpdate: (values: LinkProps) => void;
}

export const LinkView = ({ state, onUpdate }: LinkViewProps) => {
  const trpc = useTRPC();
  const [search, setSearch] = useDebounceValue("", 300);

  const linkType = getSmartLinkType(state);

  const pages = useQuery({
    ...trpc.pages.getMany.queryOptions({ pageSize: 100, search }),
    enabled: linkType === "page",
    placeholderData: keepPreviousData,
  });
  const posts = useQuery({
    ...trpc.posts.getMany.queryOptions({ pageSize: 100, search }),
    enabled: linkType === "post",
    placeholderData: keepPreviousData,
  });
  const products = useQuery({
    ...trpc.products.getMany.queryOptions({
      pageSize: 100,
      search,
      // Entity links only resolve against the live version, so the picker
      // should not offer drafts that would render as plain text.
      publishedOnly: true,
    }),
    enabled: linkType === "product",
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({
    ...trpc.categories.getMany.queryOptions({ pageSize: 100, search }),
    enabled: linkType === "category",
    placeholderData: keepPreviousData,
  });
  const productCategories = useQuery({
    ...trpc.productCategories.getMany.queryOptions({ pageSize: 100, search }),
    enabled: linkType === "productCategory",
    placeholderData: keepPreviousData,
  });

  const { options, isLoading } = getEntityOptions({
    linkType,
    pages: pages.data,
    posts: posts.data,
    products: products.data,
    categories: categories.data,
    productCategories: productCategories.data,
    pagesLoading: pages.isLoading,
    postsLoading: posts.isLoading,
    productsLoading: products.isLoading,
    categoriesLoading: categories.isLoading,
    productCategoriesLoading: productCategories.isLoading,
  });

  const selectedId = getSmartLinkEntityId(state);
  const pickerOptions = withSelectedOption(options, selectedId, state.label);

  const handleTypeChange = (value: string) => {
    setSearch("");
    onUpdate(withSmartLinkType(state, value as SmartLinkType));
  };

  const handleTargetChange = (value: string | null) => {
    if (!value) return;

    const option = pickerOptions.find((candidate) => candidate.value === value);
    const previousOption = pickerOptions.find(
      (candidate) => candidate.value === selectedId,
    );

    // The label is auto-filled from the entity title, but a label the editor
    // typed must survive a target change. "Unchanged since it was auto-filled"
    // is detected by comparing it with the previous entity title.
    const hasCustomLabel =
      Boolean(state.label?.trim()) && state.label !== previousOption?.title;
    const next = withSmartLinkTarget(state, value);

    onUpdate(
      withLinkLabel(next, hasCustomLabel ? state.label : option?.title),
    );
  };

  return (
    <div className="grid grid-cols-1 gap-y-4 p-1">
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="type"
          label="Tipo di link"
          isModified={linkType !== "external"}
          onReset={() => onUpdate(withSmartLinkType(state, "external"))}
        />
        <Select value={linkType} onValueChange={handleTypeChange}>
          <SelectTrigger id="type" className="w-full h-8 border-input text-xs">
            <SelectValue placeholder="Tipo di link" />
          </SelectTrigger>
          <SelectContent>
            {LINK_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="label"
          label="Label"
          isModified={state.label !== undefined}
          onReset={() => onUpdate(withLinkLabel(state, undefined))}
        />
        <TextInput
          name="label"
          value={state.label}
          onChange={(newVal) =>
            onUpdate(withLinkLabel(state, newVal || undefined))
          }
          placeholder="Lascia vuoto per usare il titolo del contenuto"
        />
      </div>

      {linkType === "external" ? (
        <>
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="url"
              label="URL"
              isModified={state.type === "external" && state.url !== ""}
              onReset={() => onUpdate(withSmartLinkTarget(state, ""))}
            />
            <TextInput
              name="url"
              value={state.type === "external" ? state.url : ""}
              onChange={(newVal) => onUpdate(withSmartLinkTarget(state, newVal))}
              placeholder="https://google.com/"
            />
          </div>

          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="openInNewTab"
              label="Apertura"
              isModified={
                state.type === "external" && state.openInNewTab === true
              }
              onReset={() =>
                state.type === "external" &&
                onUpdate({ ...state, openInNewTab: undefined })
              }
            />
            <SegmentedControl
              name="openInNewTab"
              value={
                state.type === "external" && state.openInNewTab
                  ? "new"
                  : "same"
              }
              onChange={(value) => {
                if (state.type !== "external") return;
                onUpdate({ ...state, openInNewTab: value === "new" });
              }}
              items={NEW_TAB_OPTIONS.map((option) => ({
                title: option.title,
                value: option.value,
              }))}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="target"
            label="Destinazione"
            isModified={Boolean(selectedId)}
            onReset={() => onUpdate(withSmartLinkTarget(state, ""))}
          />
          {isLoading && options.length === 0 ? (
            <Skeleton className="w-full h-9" />
          ) : (
            <CommandSelect
              options={pickerOptions.map((option) => ({
                id: option.id,
                value: option.value,
                children: <span>{option.title}</span>,
              }))}
              onSelect={handleTargetChange}
              onSearch={setSearch}
              value={selectedId ?? ""}
              placeholder="Seleziona un contenuto"
              className="w-full"
            />
          )}
        </div>
      )}
    </div>
  );
};

interface EntityOptionsInput {
  linkType: SmartLinkType;
  pages: { items: { rootId: string; title: string }[] } | undefined;
  posts: { items: { rootId: string; title: string }[] } | undefined;
  products: { items: { rootId: string; title: string }[] } | undefined;
  categories: { items: { id: string; title: string }[] } | undefined;
  productCategories: { items: { id: string; title: string }[] } | undefined;
  pagesLoading: boolean;
  postsLoading: boolean;
  productsLoading: boolean;
  categoriesLoading: boolean;
  productCategoriesLoading: boolean;
}

function getEntityOptions({
  linkType,
  pages,
  posts,
  products,
  categories,
  productCategories,
  pagesLoading,
  postsLoading,
  productsLoading,
  categoriesLoading,
  productCategoriesLoading,
}: EntityOptionsInput): { options: PickerOption[]; isLoading: boolean } {
  switch (linkType) {
    case "page":
      return { options: toRootOptions(pages), isLoading: pagesLoading };
    case "post":
      return { options: toRootOptions(posts), isLoading: postsLoading };
    case "product":
      return { options: toRootOptions(products), isLoading: productsLoading };
    case "category":
      return { options: toIdOptions(categories), isLoading: categoriesLoading };
    case "productCategory":
      return {
        options: toIdOptions(productCategories),
        isLoading: productCategoriesLoading,
      };
    case "external":
      return { options: [], isLoading: false };
  }
}

function toRootOptions(
  data: { items: { rootId: string; title: string }[] } | undefined,
): PickerOption[] {
  return (data?.items ?? []).map((item) => ({
    id: item.rootId,
    value: item.rootId,
    title: item.title,
  }));
}

function toIdOptions(
  data: { items: { id: string; title: string }[] } | undefined,
): PickerOption[] {
  return (data?.items ?? []).map((item) => ({
    id: item.id,
    value: item.id,
    title: item.title,
  }));
}

/**
 * Keep the current target visible when it is not in the first page of results
 * (for example after opening an older document).
 */
function withSelectedOption(
  options: PickerOption[],
  selectedId: string | undefined,
  label: string | undefined,
): PickerOption[] {
  if (!selectedId || options.some((option) => option.value === selectedId)) {
    return options;
  }

  return [
    {
      id: selectedId,
      value: selectedId,
      title: label?.trim() || selectedId,
    },
    ...options,
  ];
}
