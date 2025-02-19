import React, { useState } from "react";
import { ReactEditor, RenderElementProps, useSlateStatic } from "slate-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { CustomEditorHelper } from "../../utils/custom-editor";
import { Transforms } from "slate";
import { Ellipsis } from "lucide-react";

export const TableElement: React.FC<RenderElementProps> = ({
  attributes,
  element,
  children,
}) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);

  const onHandleRemove = () => {
    Transforms.removeNodes(editor, { at: path });
  };
  return (
    <div {...attributes} className="relative group">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="absolute -top-10 -right-0  z-10"
          >
            Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="center" sideOffset={5}>
          <DropdownMenuItem onClick={() => onHandleRemove()}>
            Rimuovi tabella
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Table className="z-10 overflow-visible relative w-full">
        <TableBody className="z-10 overflow-visible relative">
          {children}
        </TableBody>
      </Table>
    </div>
  );
};

export const TableRowElement: React.FC<RenderElementProps> = ({
  attributes,
  children,
}) => (
  <TableRow {...attributes} className="z-10 overflow-visible relative">
    {children}
  </TableRow>
);

interface TableCellProps extends RenderElementProps {
  rowIndex: number;
  colIndex: number;
  onAddRow: (rowIndex: number) => void;
  onRemoveRow: (rowIndex: number) => void;
  onAddColumn: (colIndex: number) => void;
  onRemoveColumn: (colIndex: number) => void;
}

export const TableCellElement: React.FC<TableCellProps> = ({
  attributes,
  children,
  rowIndex,
  colIndex,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
}) => {
  const [isHovered, setIsHovered] = useState(true);
  const [isRowMenuOpen, setRowMenuOpen] = useState(false);
  const [isColMenuOpen, setColMenuOpen] = useState(false);

  return (
    <TableCell
      {...attributes}
      className="border border-solid p-2 relative overflow-visible z-10"
    >
      {(isHovered || isColMenuOpen) && rowIndex === 0 && colIndex > 0 && (
        <DropdownMenu open={isColMenuOpen} onOpenChange={setColMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setColMenuOpen(!isColMenuOpen)}
              className="absolute -top-3 right-0"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" sideOffset={5}>
            <DropdownMenuItem onClick={() => onAddColumn(colIndex)}>
              Aggiungi Colonna
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRemoveColumn(colIndex)}>
              Rimuovi Colonna
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {(isHovered || isRowMenuOpen) && colIndex === 0 && (
        <DropdownMenu open={isRowMenuOpen} onOpenChange={setRowMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRowMenuOpen(!isRowMenuOpen)}
              style={{
                position: "absolute",
                top: "50%",
                left: "-30px",
                transform: "translateY(-50%)",
                zIndex: 50,
              }}
            >
              Row
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" align="center" sideOffset={5}>
            <DropdownMenuItem onClick={() => onAddRow(rowIndex)}>
              Aggiungi Riga
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRemoveRow(rowIndex)}>
              Rimuovi Riga
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {children}
    </TableCell>
  );
};
