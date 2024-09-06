import { toast } from "@/renderer/components/ui";
import { type Consumer } from "@rails/actioncable";

export class NoticiationsChannel {
  private consumer: Consumer;

  constructor(consumer: Consumer) {
    this.consumer = consumer;
  }

  subscribe() {
    this.consumer.subscriptions.create(
      { channel: "NotificationsChannel" },
      {
        received(data) {
          if (typeof data === "string") {
            toast.info(data);
          } else {
            switch (data?.type) {
              case "success":
                toast.success(data.message);
                break;
              case "error":
                toast.error(data.message);
                break;
              case "info":
                toast.info(data.message);
                break;
              case "warning":
                toast.warning(data.message);
                break;
              default:
                toast.message(data.message);
                break;
            }
          }

          if (data.id) {
            this.markAsSeen([data.id]);
          }
        },

        markAsSeen(ids: number[]) {
          this.consumer.perform("mark_as_seen", { ids });
        },
      }
    );
  }

  unsubscribe() {
    this.consumer.disconnect();
  }
}
