import { Tabs } from "expo-router";

import CustomTabBar from "@/components/common/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <CustomTabBar
          state={props.state}
          descriptors={props.descriptors}
        />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
