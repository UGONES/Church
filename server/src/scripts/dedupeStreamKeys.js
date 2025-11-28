import mongoose from 'mongoose';
import Sermon from '../models/Sermon.mjs';

await mongoose.connect(process.env.MONGO_URI);

const cursor = Sermon.aggregate([
  { $match: { streamKey: { $exists: true, $ne: null } } },
  { $group: {
      _id: '$streamKey',
      ids: { $push: '$_id' },
      count: { $sum: 1 }
    }
  },
  { $match: { count: { $gt: 1 } } }
]);

for await (const doc of cursor) {
  const keep = doc.ids.shift(); // keep first
  const removeIds = doc.ids;
  console.log('Keep', keep, 'remove', removeIds);
  await Sermon.deleteMany({ _id: { $in: removeIds } });
}
await mongoose.disconnect();
