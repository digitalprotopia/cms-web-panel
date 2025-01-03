import { CSSProperties } from 'react';
import {
  DragDropContext, Droppable, Draggable, OnDragEndResponder,
  DraggingStyle,
  NotDraggingStyle,
} from 'react-beautiful-dnd';

// a little function to help us with reordering the result
const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const grid = 8;

const getItemStyle = (
  isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle | undefined,
): CSSProperties => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  //   padding: grid * 2,
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'grey',

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? 'lightblue' : undefined,
  padding: grid,
});

interface DndComponentProps {
  items: {
    id: string,
    component: React.JSX.Element,
  }[]
  onDrop: (items: string[]) => void;
}

export default function DndComponent(props: DndComponentProps) {
  const onDragEnd: OnDragEndResponder = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    props.onDrop(reorder(
      props.items.map((item) => item.id),
      result.source.index,
      result.destination.index,
    ));
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={getListStyle(snapshot.isDraggingOver)}
          >
            {props.items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(_provided, _snapshot) => (
                  <div
                    ref={_provided.innerRef}
                    {..._provided.draggableProps}
                    {..._provided.dragHandleProps}
                    style={getItemStyle(
                      _snapshot.isDragging,
                      _provided.draggableProps.style,
                    )}
                  >
                    {item.component}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
