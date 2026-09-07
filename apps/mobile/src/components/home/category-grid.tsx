
import { Pressable, Text, View } from 'react-native';


type Category = {
  id:string;
  ten:string;
  slug:string;
};


type Props = {
  categories:Category[];
  onPress:(slug:string)=>void;
};


export function CategoryGrid({
  categories,
  onPress,
}:Props){

  return (
    <View
      className="
      flex-row
      flex-wrap
      gap-3
      "
    >

      {categories.map(item=>(

        <Pressable
          key={item.id}
          onPress={()=>onPress(item.slug)}
          className="
          w-[30%]
          gap-2
          rounded-2xl
          border
          border-border
          bg-card
          p-4
          active:opacity-80
          "
        >

          <Text>
            🥬
          </Text>

          <Text
            className="
            font-semibold
            text-foreground
            "
          >
            {item.ten}
          </Text>


        </Pressable>

      ))}

    </View>
  );
}
